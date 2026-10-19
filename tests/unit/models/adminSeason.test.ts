import { describe, expect, it } from "vitest";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildSeasonCreatedHref } from "@/models/buildSeasonCreatedHref";
import { buildSeasonRows } from "@/models/buildSeasonRows";
import { computeSeasonDeletionImpact } from "@/models/computeSeasonDeletionImpact";
import { describeParticipantChange } from "@/models/describeParticipantChange";
import { describeSeasonListCaption } from "@/models/describeSeasonListCaption";
import { describeSeasonTeamHint } from "@/models/describeSeasonTeamHint";
import { filterSeasonRows } from "@/models/filterSeasonRows";
import { findDuplicateSeason } from "@/models/findDuplicateSeason";
import { getDefaultSeasonYears } from "@/models/getDefaultSeasonYears";
import { mapParticipantFailure } from "@/models/mapParticipantFailure";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { orderTeamsForSeason } from "@/models/orderTeamsForSeason";
import { parseSeasonId } from "@/models/parseSeasonId";
import { resolveSeasonTeamValue } from "@/models/resolveSeasonTeamValue";
import { SEASON_FAILURE_OPTIONS } from "@/models/seasonFailureOptions";
import { SEASON_FIELDS, SeasonInputSchema, type SeasonInput } from "@/models/SeasonInput";
import { SEASON_LIST_SPEC } from "@/models/seasonListSpec";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import { CANDIDATE_LIMIT, splitSeasonParticipants } from "@/models/splitSeasonParticipants";
import { sortSeasonRows } from "@/models/sortSeasonRows";
import { toSeasonFormValues } from "@/models/toSeasonFormValues";
import { summarizeDeletionImpact } from "@/models/summarizeDeletionImpact";
import type { Team } from "@/models/Team";
import type { TeamsResolution } from "@/models/TeamsResolution";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { makeSeason } from "./factories";
import { makePlayerListEntry } from "./playerFactories";

function makeTeam(id: number, name: string): Team {
  return { id, name, logoFile: null, logoUrl: null };
}

const VALID = { startYear: "2025", endYear: "2026", championship: "Régionale 2", category: "Senior", teamId: "12" };

function fieldErrors(values: Record<string, string>): Record<string, string> {
  const result = SeasonInputSchema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return errors;
}

describe("SeasonInputSchema", () => {
  it("accepte des valeurs valides et produit des nombres", () => {
    expect(SeasonInputSchema.parse(VALID)).toEqual({
      startYear: 2025,
      endYear: 2026,
      championship: "Régionale 2",
      category: "Senior",
      teamId: 12,
    });
  });

  it("rogne les espaces autour de chaque champ", () => {
    const parsed = SeasonInputSchema.parse({ ...VALID, startYear: " 2025 ", championship: "  R2  ", teamId: " 3 " });
    expect(parsed).toMatchObject({ startYear: 2025, championship: "R2", teamId: 3 });
  });

  it.each([
    ["startYear", SEASON_MESSAGES.startYearRequired],
    ["endYear", SEASON_MESSAGES.endYearRequired],
    ["championship", SEASON_MESSAGES.championshipRequired],
    ["category", SEASON_MESSAGES.categoryRequired],
    ["teamId", SEASON_MESSAGES.teamRequired],
  ])("champ %s vide : message exact, jamais un 0", (field, message) => {
    expect(fieldErrors({ ...VALID, [field]: "" })[field]).toBe(message);
    expect(fieldErrors({ ...VALID, [field]: "   " })[field]).toBe(message);
  });

  it.each(["20a5", "205", "20255", "2e3", "-2025"])("année %j : forme refusée", (value) => {
    expect(fieldErrors({ ...VALID, startYear: value, endYear: "2026" }).startYear).toBe(SEASON_MESSAGES.startYearRequired);
  });

  it("bornes 2000 et 2100 acceptées, 1999 et 2101 refusées", () => {
    expect(fieldErrors({ ...VALID, startYear: "2000", endYear: "2000" })).toEqual({});
    expect(fieldErrors({ ...VALID, startYear: "2099", endYear: "2100" })).toEqual({});
    expect(fieldErrors({ ...VALID, startYear: "1999", endYear: "2000" }).startYear).toBe(SEASON_MESSAGES.yearRange);
    expect(fieldErrors({ ...VALID, startYear: "2100", endYear: "2101" }).endYear).toBe(SEASON_MESSAGES.yearRange);
  });

  it("écart entre années : 0 et 1 acceptés, 2 et -1 refusés sur endYear", () => {
    expect(fieldErrors({ ...VALID, startYear: "2025", endYear: "2025" })).toEqual({});
    expect(fieldErrors({ ...VALID, startYear: "2025", endYear: "2026" })).toEqual({});
    expect(fieldErrors({ ...VALID, startYear: "2025", endYear: "2027" })).toEqual({ endYear: SEASON_MESSAGES.yearOrder });
    expect(fieldErrors({ ...VALID, startYear: "2025", endYear: "2024" })).toEqual({ endYear: SEASON_MESSAGES.yearOrder });
  });

  it("pas d'erreur de relation si l'une des années est invalide", () => {
    expect(fieldErrors({ ...VALID, startYear: "abc", endYear: "2026" })).toEqual({ startYear: SEASON_MESSAGES.startYearRequired });
    expect(fieldErrors({ ...VALID, startYear: "2025", endYear: "" })).toEqual({ endYear: SEASON_MESSAGES.endYearRequired });
  });

  it("championnat et catégorie : 255 caractères acceptés, 256 refusés", () => {
    expect(fieldErrors({ ...VALID, championship: "a".repeat(255), category: "b".repeat(255) })).toEqual({});
    expect(fieldErrors({ ...VALID, championship: "a".repeat(256) }).championship).toBe(SEASON_MESSAGES.championshipTooLong);
    expect(fieldErrors({ ...VALID, category: "b".repeat(256) }).category).toBe(SEASON_MESSAGES.categoryTooLong);
  });

  it.each(["0", "abc", "-1", "012", "12345678901"])("équipe %j refusée", (value) => {
    expect(fieldErrors({ ...VALID, teamId: value }).teamId).toBe(SEASON_MESSAGES.teamRequired);
  });

  it("liste exactement les champs du formulaire", () => {
    expect(Object.keys(VALID)).toEqual([...SEASON_FIELDS]);
  });
});

describe("parseSeasonId", () => {
  it.each([
    ["12", 12],
    ["1", 1],
  ])("accepte %s", (raw, expected) => {
    expect(parseSeasonId(raw)).toBe(expected);
  });

  it.each(["0", "012", "-1", "1e3", "create", "", "12345678901", "1.5"])("refuse %j", (raw) => {
    expect(parseSeasonId(raw)).toBeNull();
  });
});

describe("getDefaultSeasonYears", () => {
  it.each([
    ["2026-06-30", 2025, 2026],
    ["2026-07-01", 2026, 2027],
    ["2026-10-12", 2026, 2027],
    ["2026-12-31", 2026, 2027],
    ["2027-01-01", 2026, 2027],
  ])("%s → %i-%i", (date, startYear, endYear) => {
    expect(getDefaultSeasonYears(date)).toEqual({ startYear, endYear });
  });
});

describe("findDuplicateSeason", () => {
  const input: SeasonInput = { startYear: 2025, endYear: 2026, championship: "Régionale 2", category: "Senior", teamId: 1 };
  const existing = makeSeason({ id: 5, startYear: 2025, endYear: 2026, championship: "Régionale 2", category: "Senior", teamId: 1 });

  it("trouve une saison identique", () => {
    expect(findDuplicateSeason([existing], input)).toBe(existing);
  });

  it("ignore casse, accents et espaces multiples", () => {
    const loose = makeSeason({ id: 6, championship: "  REGIONALE   2 ", category: "senior", teamId: 1 });
    expect(findDuplicateSeason([loose], input)).toBe(loose);
  });

  it.each([
    ["autre équipe", { teamId: 2 }],
    ["autre catégorie", { category: "U17" }],
    ["autre championnat", { championship: "D1" }],
    ["autre année de début", { startYear: 2024, endYear: 2025 }],
    ["autre année de fin", { endYear: 2025 }],
  ])("%s : pas de doublon", (_label, override) => {
    expect(findDuplicateSeason([makeSeason({ ...existing, ...override })], input)).toBeNull();
  });

  it("ignore la saison modifiée (excludeSeasonId)", () => {
    expect(findDuplicateSeason([existing], input, 5)).toBeNull();
    expect(findDuplicateSeason([existing], input, 6)).toBe(existing);
  });

  it("plusieurs doublons : le plus petit identifiant", () => {
    const a = makeSeason({ ...existing, id: 9 });
    const b = makeSeason({ ...existing, id: 3 });
    expect(findDuplicateSeason([a, b], input)?.id).toBe(3);
  });

  it("liste vide : aucun doublon", () => {
    expect(findDuplicateSeason([], input)).toBeNull();
  });
});

describe("orderTeamsForSeason", () => {
  const teams = [makeTeam(1, "Zèbre"), makeTeam(2, "Étoile"), makeTeam(3, "alpha"), makeTeam(4, "Delta")];

  it("équipes utilisées d'abord, chaque groupe trié par nom (accents et casse ignorés)", () => {
    const seasons = [makeSeason({ id: 1, teamId: 1 }), makeSeason({ id: 2, teamId: 4 })];
    expect(orderTeamsForSeason(teams, seasons).map((team) => team.name)).toEqual(["Delta", "Zèbre", "alpha", "Étoile"]);
  });

  it("aucune saison : tri par nom seul", () => {
    expect(orderTeamsForSeason(teams, []).map((team) => team.name)).toEqual(["alpha", "Delta", "Étoile", "Zèbre"]);
  });

  it("saison sans équipe : ignorée ; entrée non mutée", () => {
    const copy = [...teams];
    orderTeamsForSeason(teams, [makeSeason({ teamId: null })]);
    expect(teams).toEqual(copy);
  });
});

describe("resolveSeasonTeamValue", () => {
  const teams = [makeTeam(1, "A"), makeTeam(2, "B")];

  it("équipe présente : son identifiant", () => {
    expect(resolveSeasonTeamValue(2, teams)).toBe("2");
  });

  it("null ou équipe absente : option vide, jamais la première équipe", () => {
    expect(resolveSeasonTeamValue(null, teams)).toBe("");
    expect(resolveSeasonTeamValue(99, teams)).toBe("");
  });
});

describe("describeSeasonTeamHint", () => {
  it("inconnu, aucun match, un match, plusieurs", () => {
    expect(describeSeasonTeamHint(null)).toContain("peut modifier le bilan des matchs déjà joués");
    expect(describeSeasonTeamHint(0)).toBe("C'est l'équipe du club : elle sert à compter les victoires et les défaites.");
    expect(describeSeasonTeamHint(1)).toContain("recalcule le bilan du match de cette saison");
    expect(describeSeasonTeamHint(12)).toContain("recalcule le bilan des 12 matchs de cette saison");
  });
});

describe("buildSeasonRows", () => {
  const loaded: TeamsResolution = { kind: "loaded", teams: [{ ...makeTeam(1, "FAC Basket"), logoUrl: "http://x/logo.png" }] };

  it("équipe nommée, absente, introuvable", () => {
    const rows = buildSeasonRows(
      [makeSeason({ id: 1, teamId: 1 }), makeSeason({ id: 2, teamId: null }), makeSeason({ id: 3, teamId: 9 })],
      loaded,
    );
    expect(rows.map((row) => row.team)).toEqual([
      { kind: "named", name: "FAC Basket", logoUrl: "http://x/logo.png" },
      { kind: "none" },
      { kind: "unknown", id: 9 },
    ]);
  });

  it("équipes illisibles : repli sur l'identifiant, mais « non renseignée » reste signalée", () => {
    const rows = buildSeasonRows([makeSeason({ id: 1, teamId: 4 }), makeSeason({ id: 2, teamId: null })], { kind: "unavailable" });
    expect(rows.map((row) => row.team)).toEqual([{ kind: "unavailable", id: 4 }, { kind: "none" }]);
  });

  it("la saison la plus récente porte le badge (ex æquo d'année : plus grand identifiant)", () => {
    const rows = buildSeasonRows(
      [makeSeason({ id: 1, startYear: 2024 }), makeSeason({ id: 2, startYear: 2025 }), makeSeason({ id: 3, startYear: 2025 })],
      loaded,
    );
    expect(rows.filter((row) => row.isMostRecent).map((row) => row.season.id)).toEqual([3]);
    expect(rows[0].label).toBe("2024-2026 · Régional 2 · U17");
  });

  it("liste vide", () => {
    expect(buildSeasonRows([], loaded)).toEqual([]);
  });
});

describe("filterSeasonRows et sortSeasonRows", () => {
  const teams: TeamsResolution = { kind: "loaded", teams: [makeTeam(1, "FAC Basket"), makeTeam(2, "Étoile Cugnaux")] };
  const rows = buildSeasonRows(
    [
      makeSeason({ id: 1, startYear: 2023, endYear: 2024, championship: "D3", category: "U15G", teamId: 1 }),
      makeSeason({ id: 2, startYear: 2025, endYear: 2026, championship: "D1", category: "U17", teamId: 2 }),
      makeSeason({ id: 3, startYear: 2025, endYear: 2026, championship: "Régionale", category: "Sénior", teamId: null }),
    ],
    teams,
  );

  it("recherche sur années, championnat, catégorie et nom d'équipe", () => {
    expect(filterSeasonRows(rows, "2023").map((row) => row.season.id)).toEqual([1]);
    expect(filterSeasonRows(rows, "d1").map((row) => row.season.id)).toEqual([2]);
    expect(filterSeasonRows(rows, "u15g").map((row) => row.season.id)).toEqual([1]);
    expect(filterSeasonRows(rows, "etoile").map((row) => row.season.id)).toEqual([2]);
    expect(filterSeasonRows(rows, "senior regionale").map((row) => row.season.id)).toEqual([3]);
  });

  it("recherche vide : tout, ordre conservé", () => {
    expect(filterSeasonRows(rows, "  ").map((row) => row.season.id)).toEqual([1, 2, 3]);
  });

  it("tri par année : desc par défaut, ex æquo par récence ; asc n'inverse pas le tie-break", () => {
    expect(sortSeasonRows(rows, { column: "year", direction: "desc" }).map((row) => row.season.id)).toEqual([3, 2, 1]);
    expect(sortSeasonRows(rows, { column: "year", direction: "asc" }).map((row) => row.season.id)).toEqual([1, 2, 3]);
  });

  it("tri par championnat, catégorie et équipe (sans nom en dernier dans les deux sens)", () => {
    expect(sortSeasonRows(rows, { column: "championship", direction: "asc" }).map((row) => row.season.id)).toEqual([2, 1, 3]);
    expect(sortSeasonRows(rows, { column: "category", direction: "desc" }).map((row) => row.season.id)).toEqual([2, 1, 3]);
    expect(sortSeasonRows(rows, { column: "team", direction: "asc" }).map((row) => row.season.id)).toEqual([2, 1, 3]);
    expect(sortSeasonRows(rows, { column: "team", direction: "desc" }).map((row) => row.season.id)).toEqual([1, 2, 3]);
  });

  it("colonne inconnue : ordre de récence ; entrée non mutée", () => {
    const before = rows.map((row) => row.season.id);
    expect(sortSeasonRows(rows, { column: "?", direction: "asc" }).map((row) => row.season.id)).toEqual([3, 2, 1]);
    expect(rows.map((row) => row.season.id)).toEqual(before);
  });

  it("la spécification déclare année décroissante par défaut et aucun filtre", () => {
    expect(SEASON_LIST_SPEC).toMatchObject({ defaultSort: { column: "year", direction: "desc" }, filters: [] });
  });

  it("légende : compteur, total filtré et tri en toutes lettres", () => {
    const sort = { column: "year", direction: "desc" as const };
    expect(describeSeasonListCaption(3, 3, sort)).toBe("3 saisons · triées par année, de la plus récente à la plus ancienne");
    expect(describeSeasonListCaption(1, 12, { column: "team", direction: "asc" })).toBe("1 saison sur 12 · triées par équipe, de A à Z");
  });
});

describe("computeSeasonDeletionImpact", () => {
  it("trois lignes dans l'ordre matchs, inscriptions, statistiques", () => {
    const impact = computeSeasonDeletionImpact({ gameCount: 12, participantCount: 9, statLineCount: 214 });
    expect(impact.complete).toBe(true);
    expect(summarizeDeletionImpact(impact).items.map((item) => item.text)).toEqual([
      "12 matchs",
      "9 inscriptions à une saison",
      "214 lignes de statistiques de match (tirs compris)",
    ]);
  });

  it("statistiques non calculables : null conservé, incomplet, « nombre indéterminé »", () => {
    const impact = computeSeasonDeletionImpact({ gameCount: 3, participantCount: 0, statLineCount: null });
    expect(impact.lines[2]).toEqual({ kind: "statLine", count: null });
    expect(impact.complete).toBe(false);
    const summary = summarizeDeletionImpact(impact);
    expect(summary.hasUnknown).toBe(true);
    expect(summary.items.map((item) => item.text)).toEqual(["3 matchs", "un nombre indéterminé de lignes de statistiques de match (tirs compris)"]);
  });

  it("tout à 0 : rien à afficher", () => {
    expect(summarizeDeletionImpact(computeSeasonDeletionImpact({ gameCount: 0, participantCount: 0, statLineCount: 0 })).isEmpty).toBe(true);
  });
});

describe("splitSeasonParticipants", () => {
  const players = [
    makePlayerListEntry("Élodie", "Roussel", "L1"),
    makePlayerListEntry("Paul", "Durand", "L2"),
    makePlayerListEntry("Lucas", "Marchand", "L3"),
    makePlayerListEntry("Paul", "Durand", "L2"),
  ];

  it("partitionne inscrits et candidats, sans doublon", () => {
    const split = splitSeasonParticipants(players, new Set(["L2"]), "");
    expect(split.participants.map((entry) => entry.player.licence)).toEqual(["L2"]);
    expect(split.candidates.map((entry) => entry.player.licence)).toEqual(["L1", "L3"]);
    expect(split.candidateTotal).toBe(2);
  });

  it("la recherche ne filtre que les candidats (sans accents ni casse)", () => {
    const split = splitSeasonParticipants(players, new Set(["L2"]), "elodie");
    expect(split.participants).toHaveLength(1);
    expect(split.candidates.map((entry) => entry.player.licence)).toEqual(["L1"]);
    expect(splitSeasonParticipants(players, new Set(["L2"]), "durand").candidates).toEqual([]);
  });

  it("tronque à 30 candidats et garde le total", () => {
    const many = Array.from({ length: 45 }, (_, index) => makePlayerListEntry("Jean", `Nom${index}`, `L${index}`));
    const split = splitSeasonParticipants(many, new Set(), "");
    expect(split.candidates).toHaveLength(CANDIDATE_LIMIT);
    expect(split.candidateTotal).toBe(45);
  });

  it("une licence inscrite inconnue est ignorée ; entrées non mutées", () => {
    const enrolled = new Set(["ZZ"]);
    const copy = [...players];
    const split = splitSeasonParticipants(players, enrolled, "");
    expect(split.participants).toEqual([]);
    expect(players).toEqual(copy);
    expect(enrolled).toEqual(new Set(["ZZ"]));
  });
});

describe("participants : messages", () => {
  it("describeParticipantChange : les trois issues", () => {
    expect(describeParticipantChange("added", "Paul Durand")).toBe("Inscription enregistrée : Paul Durand.");
    expect(describeParticipantChange("removed", "Paul Durand")).toBe("Retrait enregistré : Paul Durand.");
    expect(describeParticipantChange("unchanged", "Paul Durand")).toBe("Déjà inscrit : Paul Durand. Rien n'a été modifié.");
  });

  it("mapParticipantFailure : jamais une phrase du back", () => {
    expect(mapParticipantFailure({ kind: "invalid", errors: { licence: ["The selected licence is invalid."] } })).toBe(SEASON_MESSAGES.participantGone);
    expect(mapParticipantFailure({ kind: "notFound", backMessage: "Not found" })).toBe(SEASON_MESSAGES.participantGone);
    expect(mapParticipantFailure({ kind: "failed", reason: "network" })).toBe(ADMIN_MESSAGES.networkWrite);
    expect(mapParticipantFailure({ kind: "failed", reason: "server" })).toBe(ADMIN_MESSAGES.serverWrite);
    expect(mapParticipantFailure({ kind: "forbidden" })).toBe(ADMIN_MESSAGES.forbidden);
    expect(mapParticipantFailure({ kind: "conflict" })).toBe(ADMIN_MESSAGES.conflict);
  });
});

describe("buildSeasonCreatedHref", () => {
  it("id connu : édition de la saison avec la notice, ancrée au bandeau", () => {
    expect(buildSeasonCreatedHref(17)).toBe("/admin/season/17/edit?notice=created");
  });

  it("id illisible : la liste avec la notice", () => {
    expect(buildSeasonCreatedHref(null)).toBe("/admin/season?notice=created");
  });

  it("appendAdminNotice garde la notice en dernier", () => {
    expect(appendAdminNotice("/admin/season/17/edit?q=abc", { code: "created" })).toBe("/admin/season/17/edit?q=abc&notice=created");
  });
});

describe("SEASON_FAILURE_OPTIONS", () => {
  const values = { startYear: "2025", endYear: "2026", championship: "R2", category: "S", teamId: "1" };

  it("422 : erreurs sur les bons champs, en français", () => {
    const state = mapWriteFailure(
      { kind: "invalid", errors: { annee_debut: ["The annee debut field is required."], equipe: ["The selected equipe is invalid."] } },
      values,
      SEASON_FAILURE_OPTIONS,
    );
    expect(state.fieldErrors.startYear).toBe("Ce champ est obligatoire.");
    expect(state.fieldErrors.teamId).toBe(SEASON_MESSAGES.teamGone);
    expect(JSON.stringify(state)).not.toContain("The ");
  });

  it("404 : saison disparue", () => {
    expect(mapWriteFailure({ kind: "notFound", backMessage: null }, values, SEASON_FAILURE_OPTIONS).message).toBe(SEASON_MESSAGES.seasonGone);
  });
});

describe("toSeasonFormValues", () => {
  const teams = [makeTeam(1, "FAC Basket")];

  it("création : années de la saison en cours, champs vides, équipe non choisie", () => {
    expect(toSeasonFormValues(null, teams, "2026-10-12")).toEqual({
      startYear: "2026",
      endYear: "2027",
      championship: "",
      category: "",
      teamId: "",
    });
    expect(toSeasonFormValues(null, teams, "2026-06-30")).toMatchObject({ startYear: "2025", endYear: "2026" });
  });

  it("modification : valeurs de la saison, équipe reconnue", () => {
    expect(toSeasonFormValues(makeSeason({ teamId: 1 }), teams, "2026-10-12")).toEqual({
      startYear: "2025",
      endYear: "2026",
      championship: "Régional 2",
      category: "U17",
      teamId: "1",
    });
  });

  it("modification : équipe nulle ou inconnue → option vide, jamais la première équipe", () => {
    expect(toSeasonFormValues(makeSeason({ teamId: null }), teams, "2026-10-12").teamId).toBe("");
    expect(toSeasonFormValues(makeSeason({ teamId: 99 }), teams, "2026-10-12").teamId).toBe("");
  });
});
