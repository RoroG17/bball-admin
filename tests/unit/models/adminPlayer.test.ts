import { describe, expect, it } from "vitest";
import type { AdminPlayer } from "@/models/AdminPlayer";
import { ADMIN_REVALIDATION } from "@/models/adminRevalidation";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { buildPlayerCreatedHref } from "@/models/buildPlayerCreatedHref";
import { CIVILITY_OPTIONS } from "@/models/Civility";
import { computeAge } from "@/models/computeAge";
import { computePlayerDeletionImpact } from "@/models/computePlayerDeletionImpact";
import { describePlayerListCaption } from "@/models/describePlayerListCaption";
import { dropInvalidPlayerTeam } from "@/models/dropInvalidPlayerTeam";
import { filterAdminPlayers } from "@/models/filterAdminPlayers";
import { filterPlayersByName } from "@/models/filterPlayersByName";
import { listPlayerTeams } from "@/models/listPlayerTeams";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { normalizePhotoFileName } from "@/models/normalizePhotoFileName";
import { normalizePlayerLicence } from "@/models/normalizePlayerLicence";
import { parseCivility } from "@/models/parseCivility";
import { parseTeamFilter } from "@/models/parseTeamFilter";
import { PLAYER_FAILURE_OPTIONS } from "@/models/playerFailureOptions";
import { createPlayerInputSchema, PLAYER_FIELDS } from "@/models/PlayerInput";
import { resolvePhotoPreview } from "@/models/resolvePhotoPreview";
import { resolvePlayerEnrollment } from "@/models/resolvePlayerEnrollment";
import { sortAdminPlayers } from "@/models/sortAdminPlayers";
import { EMPTY_PLAYER_VALUES, toPlayerFormValues } from "@/models/toPlayerFormValues";
import { toTeamSelectOptions } from "@/models/toTeamSelectOptions";
import { makeSeason } from "./factories";
import { makePlayerListEntry } from "./playerFactories";

const TODAY = "2026-10-12";
const BASE = "http://api.test/public/images/joueur/";

function makeAdminPlayer(
  firstName: string,
  lastName: string,
  licence: string,
  overrides: { teamId?: number; teamName?: string; birthDate?: string; civility?: string; photoFile?: string | null } = {},
): AdminPlayer {
  const entry = makePlayerListEntry(firstName, lastName, licence);
  return {
    ...entry,
    team: { ...entry.team, id: overrides.teamId ?? 1, name: overrides.teamName ?? "FAC Basket" },
    personalInfo: { civility: overrides.civility ?? "M", birthDate: overrides.birthDate ?? "2011-01-01" },
    photoFile: overrides.photoFile ?? null,
  };
}

const VALID = {
  licence: "AB12",
  lastName: "Durand",
  firstName: "Paul",
  civility: "M",
  birthDate: "2011-03-12",
  photo: "",
  teamId: "3",
};

const schema = createPlayerInputSchema(TODAY);

function firstError(values: Record<string, string>, field: string): string | undefined {
  const result = schema.safeParse({ ...VALID, ...values });
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("createPlayerInputSchema", () => {
  it("accepte une saisie valide et normalise les valeurs", () => {
    const result = schema.safeParse({ ...VALID, licence: " ab 12 ", lastName: "  Durand ", firstName: " Paul  " });
    expect(result.success && result.data).toEqual({
      licence: "AB12",
      lastName: "Durand",
      firstName: "Paul",
      civility: "M",
      birthDate: "2011-03-12",
      photo: null,
      teamId: 3,
    });
  });

  it.each([
    ["licence", "", ADMIN_PLAYER_MESSAGES.licenceRequired],
    ["licence", "   ", ADMIN_PLAYER_MESSAGES.licenceRequired],
    ["licence", "ABCDEFGHI", ADMIN_PLAYER_MESSAGES.licenceInvalid],
    ["licence", "AB/12", ADMIN_PLAYER_MESSAGES.licenceInvalid],
    ["licence", "é1", ADMIN_PLAYER_MESSAGES.licenceInvalid],
    ["lastName", "  ", ADMIN_PLAYER_MESSAGES.lastNameRequired],
    ["lastName", "a".repeat(256), ADMIN_PLAYER_MESSAGES.lastNameTooLong],
    ["firstName", "", ADMIN_PLAYER_MESSAGES.firstNameRequired],
    ["firstName", "a".repeat(256), ADMIN_PLAYER_MESSAGES.firstNameTooLong],
    ["civility", "", ADMIN_PLAYER_MESSAGES.civilityRequired],
    ["civility", "m", ADMIN_PLAYER_MESSAGES.civilityRequired],
    ["civility", "Mr", ADMIN_PLAYER_MESSAGES.civilityRequired],
    ["birthDate", "", ADMIN_PLAYER_MESSAGES.birthDateInvalid],
    ["birthDate", "2026-02-30", ADMIN_PLAYER_MESSAGES.birthDateInvalid],
    ["birthDate", "12/03/2011", ADMIN_PLAYER_MESSAGES.birthDateInvalid],
    ["birthDate", "2026-10-13", ADMIN_PLAYER_MESSAGES.birthDateFuture],
    ["birthDate", "1929-12-31", ADMIN_PLAYER_MESSAGES.birthDateTooOld],
    ["teamId", "", ADMIN_PLAYER_MESSAGES.teamRequired],
    ["teamId", "0", ADMIN_PLAYER_MESSAGES.teamRequired],
    ["teamId", "abc", ADMIN_PLAYER_MESSAGES.teamRequired],
    ["teamId", "1.5", ADMIN_PLAYER_MESSAGES.teamRequired],
    ["photo", "a/b.png", ADMIN_PLAYER_MESSAGES.photoInvalid],
    ["photo", "x.svg", ADMIN_PLAYER_MESSAGES.photoInvalid],
    ["photo", `${"a".repeat(256)}.png`, ADMIN_PLAYER_MESSAGES.photoInvalid],
  ])("%s = %j → %s", (field, value, message) => {
    expect(firstError({ [field]: value }, field)).toBe(message);
  });

  it("licence : minuscules et espaces internes normalisés, 8 caractères acceptés", () => {
    expect(schema.safeParse({ ...VALID, licence: "ab 12" }).success).toBe(true);
    expect(schema.safeParse({ ...VALID, licence: "ABCD1234" }).success).toBe(true);
  });

  it("date de naissance : bornes incluses (1930-01-01 et aujourd'hui)", () => {
    expect(schema.safeParse({ ...VALID, birthDate: "1930-01-01" }).success).toBe(true);
    expect(schema.safeParse({ ...VALID, birthDate: TODAY }).success).toBe(true);
  });

  it("photo : vide → null, casse conservée, extension insensible à la casse", () => {
    const empty = schema.safeParse({ ...VALID, photo: "  " });
    expect(empty.success && empty.data.photo).toBeNull();
    const upper = schema.safeParse({ ...VALID, photo: "Aubert.PNG" });
    expect(upper.success && upper.data.photo).toBe("Aubert.PNG");
  });

  it("n'expose qu'une liste fermée de champs", () => {
    expect(PLAYER_FIELDS).toEqual(["licence", "lastName", "firstName", "civility", "birthDate", "photo", "teamId"]);
    expect(CIVILITY_OPTIONS.map((option) => option.value)).toEqual(["M", "F"]);
  });
});

describe("normalizePlayerLicence", () => {
  it.each([
    ["ab12", "AB12"],
    [" a b 1 2 ", "AB12"],
    ["a\t1", "A1"],
    ["", ""],
  ])("%j → %j", (raw, expected) => {
    expect(normalizePlayerLicence(raw)).toBe(expected);
  });
});

describe("parseCivility", () => {
  it.each([
    ["M", "M"],
    ["F", "F"],
    [" F ", "F"],
    ["m", null],
    ["Mr", null],
    ["Homme", null],
    ["", null],
  ])("%j → %j", (raw, expected) => {
    expect(parseCivility(raw)).toBe(expected);
  });
});

describe("normalizePhotoFileName et resolvePhotoPreview", () => {
  it("vide → none", () => {
    expect(normalizePhotoFileName("  ")).toEqual({ kind: "none" });
    expect(resolvePhotoPreview(BASE, "")).toEqual({ kind: "none" });
  });

  it.each(["a/b.png", "a\\b.png", "photo.svg", "photo", "a\u0000.png", `${"a".repeat(256)}.png`])("%j → invalid", (raw) => {
    expect(normalizePhotoFileName(raw)).toEqual({ kind: "invalid" });
    expect(resolvePhotoPreview(BASE, raw)).toEqual({ kind: "invalid" });
  });

  it.each(["a.png", "A.JPG", "b.jpeg", "c.webp", "d.gif"])("%j → ok", (raw) => {
    expect(normalizePhotoFileName(raw)).toEqual({ kind: "ok", fileName: raw });
  });

  it("URL : casse conservée, nom encodé, espaces de bordure rognés, base sans slash final non supposée", () => {
    expect(resolvePhotoPreview(BASE, " Aubert Paul.png ")).toEqual({
      kind: "url",
      url: `${BASE}Aubert%20Paul.png`,
      fileName: "Aubert Paul.png",
    });
    expect(resolvePhotoPreview("http://x/joueur/", "a.png")).toMatchObject({ url: "http://x/joueur/a.png" });
  });
});

describe("computeAge", () => {
  it("veille, jour et lendemain d'anniversaire", () => {
    expect(computeAge("2011-10-13", "2026-10-12")).toBe(14);
    expect(computeAge("2011-10-12", "2026-10-12")).toBe(15);
    expect(computeAge("2011-10-11", "2026-10-12")).toBe(15);
  });

  it("29 février : fêté le 1er mars des années non bissextiles", () => {
    expect(computeAge("2012-02-29", "2025-02-28")).toBe(12);
    expect(computeAge("2012-02-29", "2025-03-01")).toBe(13);
    expect(computeAge("2012-02-29", "2028-02-29")).toBe(16);
  });

  it("naissance le jour même : 0 an ; future ou invalide : null", () => {
    expect(computeAge("2026-10-12", "2026-10-12")).toBe(0);
    expect(computeAge("2026-10-13", "2026-10-12")).toBeNull();
    expect(computeAge("2026-02-30", "2026-10-12")).toBeNull();
    expect(computeAge("2011-01-01", "n'importe quoi")).toBeNull();
  });
});

describe("parseTeamFilter et dropInvalidPlayerTeam", () => {
  it.each([
    ["3", 3],
    ["0", null],
    ["007", null],
    ["abc", null],
    ["", null],
    [undefined, null],
  ])("%j → %j", (raw, expected) => {
    expect(parseTeamFilter(raw)).toBe(expected);
  });

  it("garde un filtre valide (même objet), retire un filtre invalide ou vide, garde le reste", () => {
    const valid = { equipe: "3", q: "a" };
    expect(dropInvalidPlayerTeam(valid)).toBe(valid);
    expect(dropInvalidPlayerTeam({ equipe: "abc", q: "a", notice: "updated" })).toEqual({ q: "a", notice: "updated" });
    expect(dropInvalidPlayerTeam({ equipe: "" })).toEqual({});
    expect(dropInvalidPlayerTeam({ equipe: ["abc", "3"] })).toEqual({});
    expect(dropInvalidPlayerTeam({ equipe: ["3", "abc"] })).toEqual({ equipe: ["3", "abc"] });
    const none = { q: "a" };
    expect(dropInvalidPlayerTeam(none)).toBe(none);
  });
});

describe("filterAdminPlayers", () => {
  const rows = [
    makeAdminPlayer("José", "Garcia", "LIC10", { teamId: 1 }),
    makeAdminPlayer("Paul", "Durand", "LIC20", { teamId: 2, teamName: "OTB" }),
    makeAdminPlayer("Élodie", "Roussel", "ABC30", { teamId: 1 }),
  ];

  it("recherche sans accents ni casse, plusieurs mots", () => {
    expect(filterAdminPlayers(rows, { q: "jose", teamId: null }).map((row) => row.player.licence)).toEqual(["LIC10"]);
    expect(filterAdminPlayers(rows, { q: "ELODIE rou", teamId: null }).map((row) => row.player.licence)).toEqual(["ABC30"]);
  });

  it("recherche par licence", () => {
    expect(filterAdminPlayers(rows, { q: "lic", teamId: null })).toHaveLength(2);
    expect(filterAdminPlayers(rows, { q: "abc3", teamId: null }).map((row) => row.player.licence)).toEqual(["ABC30"]);
  });

  it("filtre d'équipe seul et combiné", () => {
    expect(filterAdminPlayers(rows, { q: "", teamId: 2 }).map((row) => row.player.licence)).toEqual(["LIC20"]);
    expect(filterAdminPlayers(rows, { q: "lic", teamId: 1 }).map((row) => row.player.licence)).toEqual(["LIC10"]);
  });

  it("recherche vide : tout, ordre conservé ; aucun résultat ; entrée non mutée", () => {
    const copy = [...rows];
    const all = filterAdminPlayers(rows, { q: " ", teamId: null });
    expect(all).toEqual(rows);
    expect(all).not.toBe(rows);
    expect(filterAdminPlayers(rows, { q: "zzz", teamId: null })).toEqual([]);
    expect(rows).toEqual(copy);
  });

  it("filterPlayersByName générique : renvoie les objets d'origine", () => {
    expect(filterPlayersByName(rows, "paul")[0]).toBe(rows[1]);
  });
});

describe("sortAdminPlayers", () => {
  const rows = [
    makeAdminPlayer("Fabien", "Zola", "C", { birthDate: "2010-05-01", teamName: "OTB", teamId: 2 }),
    makeAdminPlayer("Élodie", "Zola", "B", { birthDate: "2012-05-01" }),
    makeAdminPlayer("Paul", "Adam", "A", { birthDate: "2011-05-01" }),
  ];
  const sorted = (column: string, direction: "asc" | "desc") =>
    sortAdminPlayers(rows, { column, direction }).map((row) => row.player.licence);

  it("nom : puis prénom (Élodie avant Fabien), desc inverse la colonne", () => {
    expect(sorted("nom", "asc")).toEqual(["A", "B", "C"]);
    expect(sorted("nom", "desc")).toEqual(["C", "B", "A"]);
  });

  it("licence, équipe, naissance", () => {
    expect(sorted("licence", "desc")).toEqual(["C", "B", "A"]);
    expect(sorted("equipe", "asc")).toEqual(["A", "B", "C"]);
    expect(sorted("equipe", "desc")).toEqual(["C", "A", "B"]);
    expect(sorted("naissance", "asc")).toEqual(["C", "A", "B"]);
    expect(sorted("naissance", "desc")).toEqual(["B", "A", "C"]);
  });

  it("colonne inconnue : départage seul ; entrée non mutée", () => {
    const before = rows.map((row) => row.player.licence);
    expect(sorted("inconnue", "asc")).toEqual(["A", "B", "C"]);
    expect(rows.map((row) => row.player.licence)).toEqual(before);
  });
});

describe("listPlayerTeams et toTeamSelectOptions", () => {
  it("équipes présentes, sans doublon, triées", () => {
    const rows = [
      makeAdminPlayer("A", "A", "1", { teamId: 2, teamName: "OTB" }),
      makeAdminPlayer("B", "B", "2", { teamId: 1, teamName: "FAC" }),
      makeAdminPlayer("C", "C", "3", { teamId: 2, teamName: "OTB" }),
    ];
    expect(listPlayerTeams(rows)).toEqual([
      { id: 1, name: "FAC" },
      { id: 2, name: "OTB" },
    ]);
  });

  it("options : valeur en chaîne, tri sans accents", () => {
    expect(
      toTeamSelectOptions([
        { id: 3, name: "Zèbres" },
        { id: 1, name: "Étoile" },
      ]),
    ).toEqual([
      { value: "1", label: "Étoile" },
      { value: "3", label: "Zèbres" },
    ]);
  });
});

describe("describePlayerListCaption", () => {
  it("compteur, filtré et tri en toutes lettres", () => {
    expect(describePlayerListCaption(18, 18, { column: "nom", direction: "asc" })).toBe("18 joueurs · triés par nom, de A à Z");
    expect(describePlayerListCaption(1, 18, { column: "naissance", direction: "desc" })).toBe(
      "1 joueur sur 18 · triés par date de naissance, du plus jeune au plus âgé",
    );
    expect(describePlayerListCaption(0, 0, { column: "x", direction: "asc" })).toBe("0 joueur");
  });
});

describe("computePlayerDeletionImpact", () => {
  it("cinq lignes dans l'ordre, null conservé (jamais 0), complet", () => {
    const impact = computePlayerDeletionImpact({
      accountCount: 1,
      seasonCount: null,
      statLineCount: 12,
      examCount: 0,
      measurementCount: null,
    });
    expect(impact.lines).toEqual([
      { kind: "account", count: 1 },
      { kind: "participation", count: null },
      { kind: "statLine", count: 12 },
      { kind: "exam", count: 0 },
      { kind: "measurement", count: null },
    ]);
    expect(impact.complete).toBe(true);
  });

  it("tout à zéro", () => {
    const impact = computePlayerDeletionImpact({
      accountCount: 0,
      seasonCount: 0,
      statLineCount: 0,
      examCount: 0,
      measurementCount: 0,
    });
    expect(impact.lines.every((line) => line.count === 0)).toBe(true);
  });
});

describe("resolvePlayerEnrollment", () => {
  const old = makeSeason({ id: 1, startYear: 2024, endYear: 2025 });
  const recent = makeSeason({ id: 4, startYear: 2025, endYear: 2026 });

  it("aucune saison", () => {
    expect(resolvePlayerEnrollment([], [])).toEqual({ kind: "noSeason" });
  });

  it("saison la plus récente inscrite ou non ; une ancienne inscription ne compte pas", () => {
    expect(resolvePlayerEnrollment([old, recent], [4])).toEqual({ kind: "enrolled", season: recent });
    expect(resolvePlayerEnrollment([old, recent], [1])).toEqual({ kind: "canEnroll", season: recent });
    expect(resolvePlayerEnrollment([old, recent], [])).toEqual({ kind: "canEnroll", season: recent });
  });

  it("identifiants de saison en doublon", () => {
    expect(resolvePlayerEnrollment([recent], [4, 4])).toEqual({ kind: "enrolled", season: recent });
  });
});

describe("toPlayerFormValues", () => {
  it("valeurs du formulaire d'édition", () => {
    expect(toPlayerFormValues(makeAdminPlayer("Paul", "Durand", "LIC1", { photoFile: "durand.png", teamId: 7 }))).toEqual({
      licence: "LIC1",
      lastName: "Durand",
      firstName: "Paul",
      civility: "M",
      birthDate: "2011-01-01",
      photo: "durand.png",
      teamId: "7",
    });
  });

  it("civilité inconnue → vide ; photo null → vide", () => {
    const values = toPlayerFormValues(makeAdminPlayer("Paul", "Durand", "LIC1", { civility: "Homme" }));
    expect(values.civility).toBe("");
    expect(values.photo).toBe("");
  });

  it("valeurs vides de la création", () => {
    expect(Object.keys(EMPTY_PLAYER_VALUES)).toEqual([...PLAYER_FIELDS]);
    expect(Object.values(EMPTY_PLAYER_VALUES).every((value) => value === "")).toBe(true);
  });
});

describe("PLAYER_FAILURE_OPTIONS", () => {
  const values = { ...EMPTY_PLAYER_VALUES };

  it("equipe et Id_Equipe désignent le même champ", () => {
    for (const backField of ["equipe", "Id_Equipe"]) {
      const state = mapWriteFailure(
        { kind: "invalid", errors: { [backField]: ["The selected equipe is invalid."] } },
        values,
        PLAYER_FAILURE_OPTIONS,
      );
      expect(state.fieldErrors).toEqual({ teamId: ADMIN_PLAYER_MESSAGES.teamUnknown });
    }
  });

  it("licence déjà prise : texte local, jamais la phrase du back", () => {
    const state = mapWriteFailure(
      { kind: "invalid", errors: { licence: ["The licence has already been taken."] } },
      values,
      PLAYER_FAILURE_OPTIONS,
    );
    expect(state.fieldErrors).toEqual({ licence: ADMIN_PLAYER_MESSAGES.licenceTaken });
    expect(JSON.stringify(state)).not.toContain("already been taken");
  });

  it("champ inconnu → refus générique ; 404 → joueur disparu", () => {
    const unknown = mapWriteFailure({ kind: "invalid", errors: { surprise: ["x"] } }, values, PLAYER_FAILURE_OPTIONS);
    expect(unknown.fieldErrors).toEqual({});
    expect(unknown.message).toBeTruthy();
    expect(mapWriteFailure({ kind: "notFound", backMessage: null }, values, PLAYER_FAILURE_OPTIONS).message).toBe(
      ADMIN_PLAYER_MESSAGES.playerGone,
    );
  });
});

describe("buildPlayerCreatedHref", () => {
  it("encode la licence", () => {
    expect(buildPlayerCreatedHref("LIC1")).toBe("/admin/player/LIC1/created");
    expect(buildPlayerCreatedHref("a b")).toBe("/admin/player/a%20b/created");
  });
});

describe("ADMIN_REVALIDATION.player", () => {
  it("couvre les pages d'édition et de création, et invalide le palmarès à la modification et à la suppression", () => {
    const { targets, hallOfFameOn } = ADMIN_REVALIDATION.player;
    expect(targets).toContain("/admin/player");
    expect(targets).toContainEqual({ pattern: "/admin/player/[licence]/edit", type: "page" });
    expect(targets).toContainEqual({ pattern: "/admin/player/[licence]/created", type: "page" });
    expect(hallOfFameOn).toEqual(["update", "delete"]);
  });
});
