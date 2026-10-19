import { describe, expect, it } from "vitest";
import type { AdminListQuery } from "@/models/AdminListQuery";
import { buildTeamListRows } from "@/models/buildTeamListRows";
import { computeTeamDeletionImpact } from "@/models/computeTeamDeletionImpact";
import { computeTeamUsage } from "@/models/computeTeamUsage";
import { countTeamGames } from "@/models/countTeamGames";
import { describeTeamClubRole } from "@/models/describeTeamClubRole";
import { describeTeamListCaption } from "@/models/describeTeamListCaption";
import { dropInvalidTeamType } from "@/models/dropInvalidTeamType";
import { filterTeamsByName } from "@/models/filterTeamsByName";
import { findTeamNameConflict } from "@/models/findTeamNameConflict";
import type { GameTeamRef } from "@/models/GameTeamRef";
import { isValidLogoFileName } from "@/models/isValidLogoFileName";
import { parseTeamId } from "@/models/parseTeamId";
import { queryTeamRows } from "@/models/queryTeamRows";
import type { Team } from "@/models/Team";
import { TEAM_FIELDS, TeamInputSchema } from "@/models/TeamInput";
import { TEAM_FAILURE_OPTIONS } from "@/models/teamFailureOptions";
import { TEAM_MESSAGES } from "@/models/teamMessages";
import { ADMIN_REVALIDATION } from "@/models/adminRevalidation";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { makePlayerListEntry } from "./playerFactories";
import { makeSeason } from "./factories";

function makeTeam(id: number, name: string, logoFile: string | null = null): Team {
  return { id, name, logoFile, logoUrl: logoFile ? `http://api.test/public/images/logo/${logoFile}` : null };
}

function playerOf(teamId: number, licence: string) {
  const entry = makePlayerListEntry("Paul", "Durand", licence);
  return { ...entry, team: { ...entry.team, id: teamId } };
}

const QUERY: AdminListQuery = { q: "", sort: { column: "name", direction: "asc" }, filters: {}, page: 1 };

describe("isValidLogoFileName", () => {
  it.each(["logo_colomiers.png", "logo_noe-carbonne.png", "Logo Étoile (2).png", "a"])("accepte %s", (value) => {
    expect(isValidLogoFileName(value)).toBe(true);
  });

  it.each([
    "",
    "a/b.png",
    "..\\x.png",
    "../x",
    "https://x/y.png",
    "x..png",
    ".hidden",
    "x?.png",
    "x%2e.png",
    "x#y.png",
    "a".repeat(256),
  ])("refuse %j", (value) => {
    expect(isValidLogoFileName(value)).toBe(false);
  });

  it("accepte 255 caractères", () => {
    expect(isValidLogoFileName("a".repeat(255))).toBe(true);
  });
});

describe("TeamInputSchema", () => {
  it("rogne le nom et transforme un logo vide en null", () => {
    expect(TeamInputSchema.parse({ name: "  Colomiers  ", logo: "  " })).toEqual({ name: "Colomiers", logo: null });
  });

  it("refuse un nom vide ou d'espaces", () => {
    const result = TeamInputSchema.safeParse({ name: "   ", logo: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(TEAM_MESSAGES.nameRequired);
  });

  it("255 caractères passent, 256 non", () => {
    expect(TeamInputSchema.safeParse({ name: "a".repeat(255), logo: "" }).success).toBe(true);
    const result = TeamInputSchema.safeParse({ name: "a".repeat(256), logo: "" });
    expect(result.error?.issues[0].message).toBe(TEAM_MESSAGES.nameTooLong);
  });

  it("refuse un logo invalide, une seule erreur pour un logo trop long", () => {
    const invalid = TeamInputSchema.safeParse({ name: "A", logo: "a/b.png" });
    expect(invalid.error?.issues.map((issue) => issue.message)).toEqual([TEAM_MESSAGES.logoInvalid]);
    const tooLong = TeamInputSchema.safeParse({ name: "A", logo: "a".repeat(256) });
    expect(tooLong.error?.issues.map((issue) => issue.message)).toEqual([TEAM_MESSAGES.logoTooLong]);
  });

  it("déclare les deux champs", () => {
    expect(TEAM_FIELDS).toEqual(["name", "logo"]);
  });
});

describe("TEAM_FAILURE_OPTIONS", () => {
  it("un 422 sur nom est traduit en français sur le champ", () => {
    const state = mapWriteFailure(
      { kind: "invalid", errors: { nom: ["The nom field is required."] } },
      { name: "", logo: "" },
      TEAM_FAILURE_OPTIONS,
    );
    expect(state.fieldErrors).toEqual({ name: "Ce champ est obligatoire." });
  });
});

describe("parseTeamId", () => {
  it.each([
    ["12", 12],
    ["1", 1],
    ["0", null],
    ["-1", null],
    ["abc", null],
    ["1.5", null],
    ["01", null],
    ["12345678901", null],
    ["", null],
  ])("%j → %j", (raw, expected) => {
    expect(parseTeamId(raw)).toBe(expected);
  });
});

describe("findTeamNameConflict", () => {
  const teams = [makeTeam(1, "Colomiers"), makeTeam(2, "Étoile  Sportive"), makeTeam(3, "colomiers")];

  it("ignore casse, accents et espaces multiples", () => {
    expect(findTeamNameConflict(teams, "COLOMIERS")?.id).toBe(1);
    expect(findTeamNameConflict(teams, "etoile sportive")?.id).toBe(2);
  });

  it("aucun conflit : nom libre, liste vide, candidat vide", () => {
    expect(findTeamNameConflict(teams, "Toulouse")).toBeNull();
    expect(findTeamNameConflict([], "Colomiers")).toBeNull();
    expect(findTeamNameConflict(teams, "  ")).toBeNull();
  });

  it("ignore l'équipe elle-même", () => {
    expect(findTeamNameConflict([makeTeam(1, "Colomiers")], "Colomiers", 1)).toBeNull();
  });

  it("une édition sans changement de nom n'est pas bloquée malgré un doublon préexistant", () => {
    expect(findTeamNameConflict(teams, "Colomiers", 1)).toBeNull();
  });

  it("renommer vers le nom d'une autre équipe est un conflit", () => {
    expect(findTeamNameConflict(teams, "Étoile Sportive", 1)?.id).toBe(2);
  });
});

describe("buildTeamListRows, filterTeamsByName, queryTeamRows", () => {
  const teams = [makeTeam(1, "Fabien BC"), makeTeam(2, "Élodie BC"), makeTeam(3, "Étoile Sportive"), makeTeam(4, "Zèbre")];
  const seasons = [makeSeason({ id: 4, teamId: 1 }), makeSeason({ id: 1, teamId: 1 })];
  const players = [playerOf(1, "A"), playerOf(1, "B"), playerOf(2, "C")];
  const rows = buildTeamListRows(teams, seasons, players);

  it("équipe du club, autre équipe, zéro joueur", () => {
    expect(rows[0]).toMatchObject({ playerCount: 2 });
    expect(rows[0].clubSeasons).toHaveLength(2);
    expect(rows[1].clubSeasons).toEqual([]);
    expect(rows[3].playerCount).toBe(0);
  });

  it("source illisible : indicateurs à null", () => {
    const degraded = buildTeamListRows(teams, null, null);
    expect(degraded.every((row) => row.clubSeasons === null && row.playerCount === null)).toBe(true);
  });

  it("recherche : accents, casse, plusieurs mots, vide, aucun résultat", () => {
    expect(filterTeamsByName(rows, "etoile").map((row) => row.team.id)).toEqual([3]);
    expect(filterTeamsByName(rows, "ÉLODIE").map((row) => row.team.id)).toEqual([2]);
    expect(filterTeamsByName(rows, "sportive etoile").map((row) => row.team.id)).toEqual([3]);
    expect(filterTeamsByName(rows, "").map((row) => row.team.id)).toEqual([1, 2, 3, 4]);
    expect(filterTeamsByName(rows, "xyz")).toEqual([]);
  });

  it("tri par défaut : Élodie avant Fabien", () => {
    expect(queryTeamRows(rows, QUERY).map((row) => row.team.name)).toEqual([
      "Élodie BC",
      "Étoile Sportive",
      "Fabien BC",
      "Zèbre",
    ]);
  });

  it("desc inverse le tri mais pas le départage", () => {
    const sorted = queryTeamRows(rows, { ...QUERY, sort: { column: "players", direction: "desc" } });
    expect(sorted.map((row) => row.playerCount)).toEqual([2, 1, 0, 0]);
    expect(sorted.slice(2).map((row) => row.team.name)).toEqual(["Étoile Sportive", "Zèbre"]);
  });

  it("null en dernier, dans les deux sens", () => {
    const mixed = [
      { ...rows[0], playerCount: null },
      { ...rows[1], playerCount: 1 },
      { ...rows[2], playerCount: 5 },
    ];
    for (const direction of ["asc", "desc"] as const) {
      const sorted = queryTeamRows(mixed, { ...QUERY, sort: { column: "players", direction } });
      expect(sorted.at(-1)?.playerCount).toBeNull();
    }
  });

  it("filtres club / autres, une ligne indisponible n'est dans aucun des deux", () => {
    const withUnknown = [...rows, { ...rows[3], team: makeTeam(9, "Inconnue"), clubSeasons: null }];
    expect(queryTeamRows(withUnknown, { ...QUERY, filters: { type: "club" } }).map((row) => row.team.id)).toEqual([1]);
    expect(queryTeamRows(withUnknown, { ...QUERY, filters: { type: "other" } }).map((row) => row.team.id)).toEqual([
      2, 3, 4,
    ]);
  });

  it("ignore la page et ne mute pas l'entrée", () => {
    const before = rows.map((row) => row.team.id);
    expect(queryTeamRows(rows, { ...QUERY, page: 3 })).toHaveLength(4);
    expect(rows.map((row) => row.team.id)).toEqual(before);
  });
});

describe("countTeamGames", () => {
  const colomiers = makeTeam(5, "Colomiers");
  const games: GameTeamRef[] = [
    { gameId: 1, seasonId: 4, homeName: "FAC", awayName: "Colomiers" },
    { gameId: 2, seasonId: 4, homeName: "Colomiers", awayName: "FAC" },
    { gameId: 3, seasonId: 4, homeName: "FAC", awayName: "Autre" },
  ];

  it("adversaire : compte par nom", () => {
    expect(countTeamGames(colomiers, [colomiers], [], games)).toBe(2);
  });

  it("équipe du club : compte les matchs de ses saisons", () => {
    const club = makeTeam(1, "FAC");
    expect(countTeamGames(club, [club], [makeSeason({ id: 4, teamId: 1 })], games)).toBe(3);
  });

  it("union sans double compte d'un match qui remplit les deux conditions", () => {
    const club = makeTeam(1, "FAC");
    const seasons = [makeSeason({ id: 4, teamId: 1 })];
    expect(countTeamGames(club, [club], seasons, games)).toBe(3);
  });

  it("nom non unique : null", () => {
    expect(countTeamGames(colomiers, [colomiers, makeTeam(6, "Colomiers")], [], games)).toBeNull();
  });

  it("aucune ligne : 0", () => {
    expect(countTeamGames(colomiers, [colomiers], [], [])).toBe(0);
  });
});

describe("computeTeamUsage", () => {
  it("rassemble saisons (récentes d'abord), joueurs et matchs", () => {
    const club = makeTeam(1, "FAC");
    const usage = computeTeamUsage({
      team: club,
      allTeams: [club],
      seasons: [makeSeason({ id: 1, startYear: 2024, teamId: 1 }), makeSeason({ id: 4, startYear: 2025, teamId: 1 })],
      players: [playerOf(1, "A"), playerOf(2, "B")],
      games: [{ gameId: 1, seasonId: 4, homeName: "FAC", awayName: "X" }],
    });
    expect(usage.clubSeasons.map((season) => season.id)).toEqual([4, 1]);
    expect(usage.playerCount).toBe(1);
    expect(usage.gameCount).toBe(1);
  });
});

describe("computeTeamDeletionImpact", () => {
  const club = makeTeam(1, "FAC");
  const opponent = makeTeam(2, "Colomiers");
  const seasons = [makeSeason({ id: 4, teamId: 1 })];
  const games: GameTeamRef[] = [{ gameId: 1, seasonId: 4, homeName: "FAC", awayName: "Colomiers" }];
  const lineOf = (kind: string, impact: ReturnType<typeof computeTeamDeletionImpact>) =>
    impact.lines.find((line) => line.kind === kind)?.count;

  it("adversaire sans joueur ni match : tout à 0, complet", () => {
    const lonely = makeTeam(3, "Seule");
    const impact = computeTeamDeletionImpact({
      team: lonely,
      allTeams: [club, lonely],
      seasons,
      players: [playerOf(1, "A")],
      accountLicences: ["A"],
      games,
    });
    expect(impact.lines.every((line) => line.count === 0)).toBe(true);
    expect(impact.complete).toBe(true);
  });

  it("équipe du club : joueurs, comptes, saisons et matchs chiffrés, stats indéterminées", () => {
    const impact = computeTeamDeletionImpact({
      team: club,
      allTeams: [club, opponent],
      seasons,
      players: [playerOf(1, "A"), playerOf(1, "B"), playerOf(2, "C")],
      accountLicences: ["A", "C"],
      games,
    });
    expect(lineOf("player", impact)).toBe(2);
    expect(lineOf("account", impact)).toBe(1);
    expect(lineOf("season", impact)).toBe(1);
    expect(lineOf("game", impact)).toBe(1);
    expect(lineOf("participation", impact)).toBeNull();
    expect(lineOf("statLine", impact)).toBeNull();
    expect(lineOf("exam", impact)).toBeNull();
    expect(lineOf("measurement", impact)).toBeNull();
    expect(impact.complete).toBe(false);
  });

  it("un adversaire qui a joué : matchs chiffrés, lignes de stats indéterminées", () => {
    const impact = computeTeamDeletionImpact({
      team: opponent,
      allTeams: [club, opponent],
      seasons,
      players: [],
      accountLicences: [],
      games,
    });
    expect(lineOf("game", impact)).toBe(1);
    expect(lineOf("participation", impact)).toBe(0);
    expect(lineOf("statLine", impact)).toBeNull();
    expect(lineOf("exam", impact)).toBe(0);
  });

  it("un nom non unique rend les matchs puis les stats indéterminés", () => {
    const twin = makeTeam(9, "Colomiers");
    const impact = computeTeamDeletionImpact({
      team: opponent,
      allTeams: [club, opponent, twin],
      seasons,
      players: [],
      accountLicences: [],
      games,
    });
    expect(lineOf("game", impact)).toBeNull();
    expect(lineOf("statLine", impact)).toBeNull();
  });

  it("une licence sans joueur de l'équipe est ignorée, les doublons fusionnés", () => {
    const impact = computeTeamDeletionImpact({
      team: club,
      allTeams: [club],
      seasons,
      players: [playerOf(1, "A")],
      accountLicences: ["A", "A", "Z"],
      games: [],
    });
    expect(lineOf("account", impact)).toBe(1);
  });
});

describe("describeTeamClubRole", () => {
  const seasons = [1, 2, 3, 4, 5].map((id) => makeSeason({ id, startYear: 2020 + id, endYear: 2021 + id }));

  it("aucune saison : null", () => {
    expect(describeTeamClubRole([])).toBeNull();
  });

  it("une, trois puis plus de trois saisons", () => {
    expect(describeTeamClubRole(seasons.slice(0, 1))).toBe("Équipe du club pour : 2021-2022 · Régional 2 · U17");
    expect(describeTeamClubRole(seasons.slice(0, 3))?.split(" ; ")).toHaveLength(3);
    expect(describeTeamClubRole(seasons)).toMatch(/ et 2 autres$/);
    expect(describeTeamClubRole(seasons.slice(0, 4))).toMatch(/ et 1 autre$/);
  });
});

describe("describeTeamListCaption", () => {
  it("compteur, filtre et tri en toutes lettres", () => {
    const sort = { column: "name", direction: "asc" } as const;
    expect(describeTeamListCaption(14, 14, sort)).toBe("14 équipes · triées par nom, de A à Z");
    expect(describeTeamListCaption(1, 14, sort)).toBe("1 équipe sur 14 · triées par nom, de A à Z");
    expect(describeTeamListCaption(0, 14, { column: "name", direction: "desc" })).toBe(
      "0 équipe sur 14 · triées par nom, de Z à A",
    );
  });
});

describe("dropInvalidTeamType", () => {
  it("garde club et other, retire une valeur inconnue", () => {
    expect(dropInvalidTeamType({ type: "club" })).toEqual({ type: "club" });
    expect(dropInvalidTeamType({ type: "other", q: "a" })).toEqual({ type: "other", q: "a" });
    expect(dropInvalidTeamType({ type: "x", q: "a" })).toEqual({ q: "a" });
    expect(dropInvalidTeamType({ q: "a" })).toEqual({ q: "a" });
  });

  it("tableau : conservé si le premier est valide, sinon retiré", () => {
    expect(dropInvalidTeamType({ type: ["club", "x"] })).toEqual({ type: ["club", "x"] });
    expect(dropInvalidTeamType({ type: ["x", "club"] })).toEqual({});
  });
});

describe("ADMIN_REVALIDATION.team", () => {
  it("palmarès invalidé à la suppression seulement", () => {
    expect(ADMIN_REVALIDATION.team.hallOfFameOn).toEqual(["delete"]);
    expect(ADMIN_REVALIDATION.team.targets).toContain("/admin/team");
  });
});
