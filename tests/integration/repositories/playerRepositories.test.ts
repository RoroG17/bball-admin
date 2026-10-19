import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { signSessionToken } from "@/lib/sessionToken";
import { makeSeason } from "../../unit/models/factories";
import { loadFixture, stubApi } from "../helpers";

const cookieJar = vi.hoisted(() => ({ value: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "bball_session" && cookieJar.value ? { name, value: cookieJar.value } : undefined),
  }),
}));

const { getPlayerProfile, listAllPlayers, listSeasonPlayers } = await import("@/repositories/PlayerRepository");
const { getPlayerGameLog, listPlayerStatLines, listPlayerStatSeasonIds } = await import(
  "@/repositories/PlayerStatsRepository"
);
const { countPlayerExams, listPlayerExams } = await import("@/repositories/ExamRepository");
const { getPhysicalRecord } = await import("@/repositories/PhysicalRepository");
const { listParticipationSeasonIds } = await import("@/repositories/SeasonRepository");
const { listAllGames, listSeasonGames } = await import("@/repositories/GameRepository");

type DetailPayload = {
  joueur: Record<string, unknown>;
  stats: Record<string, unknown>[];
  examens: { shoots: Record<string, unknown>[] }[];
};
const fixture = <T = unknown>(name: string) => loadFixture<T>(name, "player");
const DETAIL = "/api/joueurs/LIC1000";

beforeEach(async () => {
  cookieJar.value = await signSessionToken(
    { username: "admin", licence: null, token: "tok" },
    "test-secret-test-secret-test-secret-0123",
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PlayerRepository.listSeasonPlayers / listAllPlayers", () => {
  it("renvoie des cartes triées par nom, photo et logo absents → null", async () => {
    const calls = stubApi({ "/api/saisons/4/joueurs": fixture("saison-joueurs.json") });
    const entries = await listSeasonPlayers(4);
    expect(calls.map((call) => call.path)).toEqual(["/api/saisons/4/joueurs"]);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
    expect(entries).toHaveLength(12);
    expect(entries.map((entry) => entry.player.lastName)).toEqual(
      [...entries.map((entry) => entry.player.lastName)].sort((a, b) => a.localeCompare(b, "fr")),
    );
    expect(entries.find((entry) => entry.player.licence === "LIC1000")).toEqual({
      player: {
        licence: "LIC1000",
        lastName: "MARCHAND",
        firstName: "Lucas",
        photoUrl: "http://api.test/public/images/joueur/marchand.png",
      },
      team: { id: 1, name: "FAC Basket", logoUrl: "http://api.test/public/images/logo/logo_frouzins.png" },
    });
    expect(entries.find((entry) => entry.player.licence === "LIC1003")?.player.photoUrl).toBeNull();
    expect(entries.find((entry) => entry.player.licence === "LIC1004")?.team.logoUrl).toBeNull();
  });

  it("retire les doublons d'inscription", async () => {
    stubApi({ "/api/saisons/4/joueurs": fixture("saison-joueurs-doublon.json") });
    const entries = await listSeasonPlayers(4);
    expect(entries).toHaveLength(12);
    expect(new Set(entries.map((entry) => entry.player.licence)).size).toBe(12);
  });

  it("lit la liste complète", async () => {
    stubApi({ "/api/joueurs": fixture("joueurs.json") });
    const entries = await listAllPlayers();
    expect(entries).toHaveLength(18);
    expect(entries.some((entry) => entry.player.licence === "LIC3000")).toBe(true);
  });

  it("P2 : aucune date de naissance, civilité ni mesure dans la liste", async () => {
    stubApi({ "/api/saisons/4/joueurs": fixture("saison-joueurs.json"), "/api/joueurs": fixture("joueurs.json") });
    const raw = fixture<{ joueurs: Record<string, unknown>[] }>("joueurs.json").joueurs;
    const json = JSON.stringify([await listSeasonPlayers(4), await listAllPlayers()]);
    for (const player of raw) expect(json).not.toContain(String(player.date_naissance));
    expect(json).not.toMatch(/civilit|date_naissance|birthDate|physics|"type":"size"/);
  });
});

describe("PlayerRepository.getPlayerProfile", () => {
  it("ne lit pas les données personnelles sans autorisation (P2)", async () => {
    stubApi({ [DETAIL]: fixture("joueur-complet.json") });
    const profile = await getPlayerProfile("LIC1000", { includePersonalInfo: false });
    expect(profile).toMatchObject({ player: { licence: "LIC1000", firstName: "Lucas" }, personalInfo: null });
    const json = JSON.stringify(profile);
    expect(json).not.toContain("2011-02-08");
    expect(json).not.toMatch(/"M"|physics|172/);
  });

  it("lit civilité et date de naissance quand c'est autorisé", async () => {
    stubApi({ [DETAIL]: fixture("joueur-complet.json") });
    const profile = await getPlayerProfile("LIC1000", { includePersonalInfo: true });
    expect(profile?.personalInfo).toEqual({ civility: "M", birthDate: "2011-02-08" });
  });

  it("404 → null ; 500 → ApiError ; nom absent → ZodError", async () => {
    stubApi({ [DETAIL]: { status: 404, body: fixture("joueur-404.json") } });
    await expect(getPlayerProfile("LIC1000", { includePersonalInfo: false })).resolves.toBeNull();
    stubApi({ [DETAIL]: { status: 500, body: {} } });
    await expect(getPlayerProfile("LIC1000", { includePersonalInfo: false })).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
    });
    const payload = fixture<DetailPayload>("joueur-complet.json");
    delete payload.joueur.nom;
    stubApi({ [DETAIL]: payload });
    await expect(getPlayerProfile("LIC1000", { includePersonalInfo: false })).rejects.toBeInstanceOf(ZodError);
  });
});

describe("PlayerStatsRepository", () => {
  it("lit les lignes : Id_Match, saison, périodes, minutes ; tirs ignorés", async () => {
    stubApi({ [DETAIL]: fixture("joueur-complet.json") });
    const lines = await listPlayerStatLines("LIC1000");
    expect(lines).toHaveLength(27);
    expect(lines[0]).toMatchObject({ lineId: 7, gameId: 1, seasonId: 1, playingTimeSeconds: 13 * 60 + 23 });
    expect(lines[0].periods).toHaveLength(4);
    expect(lines[0].periods[0]).toMatchObject({ period: 1, steals: 2, twoPoints: { made: 3, missed: 0 } });
    expect(lines[2].playingTimeSeconds).toBe(32 * 60);
    expect(lines[3].playingTimeSeconds).toBeNull();
    expect(lines[4].periods[3]).toMatchObject({ fouls: null, blocks: null });
    expect(JSON.stringify(lines)).not.toContain("shoots");
  });

  it("accepte des compteurs en chaînes numériques, refuse un compteur absent", async () => {
    const payload = fixture<DetailPayload>("joueur-complet.json");
    payload.stats[0].q1_interceptions = "2";
    stubApi({ [DETAIL]: payload });
    expect((await listPlayerStatLines("LIC1000"))[0].periods[0].steals).toBe(2);
    stubApi({ [DETAIL]: fixture("joueur-stats-invalides.json") });
    await expect(listPlayerStatLines("LIC1000")).rejects.toBeInstanceOf(ZodError);
  });

  it("donne les saisons des lignes sans valider les compteurs, ne lève pas", async () => {
    stubApi({ [DETAIL]: fixture("joueur-stats-invalides.json") });
    expect(await listPlayerStatSeasonIds("LIC1000")).toEqual([1, 4]);
    stubApi({ [DETAIL]: { ...fixture<DetailPayload>("joueur-complet.json"), stats: {} } });
    await expect(listPlayerStatSeasonIds("LIC1000")).resolves.toBeNull();
    stubApi({ [DETAIL]: { status: 404, body: fixture("joueur-404.json") } });
    await expect(listPlayerStatSeasonIds("LIC1000")).resolves.toEqual([]);
  });

  it("construit le journal : jointure avec les matchs, côté RPB, saisons du lecteur", async () => {
    stubApi({
      [DETAIL]: fixture("joueur-complet.json"),
      "/api/matchs": loadFixture("matchs.json", "calendar"),
      "/api/equipes/1": loadFixture("equipe.json", "home"),
    });
    const log = await getPlayerGameLog("LIC1000", [makeSeason({ id: 4, teamId: 1 })], "2026-06-01");
    expect(log).toHaveLength(13);
    expect(log.every((entry) => entry.seasonId === 4)).toBe(true);
    expect(log[0]).toMatchObject({
      gameId: 36,
      overview: { status: "played", rpbSide: "home", outcome: "win", game: { date: "2025-11-08" } },
    });
    expect(log.at(-1)?.gameId).toBe(48);
  });

  it("fusionne les lignes d'un même match", async () => {
    stubApi({
      [DETAIL]: fixture("joueur-doublon.json"),
      "/api/matchs": loadFixture("matchs.json", "calendar"),
      "/api/equipes/1": loadFixture("equipe.json", "home"),
    });
    const log = await getPlayerGameLog("LIC1000", [makeSeason({ id: 4, teamId: 1 })], "2026-06-01");
    expect(log.filter((entry) => entry.lineCount === 2)).toHaveLength(1);
  });
});

describe("ExamRepository", () => {
  it("trie du plus récent au plus ancien, identifiants uniques, positions normalisées, zone inconnue → null", async () => {
    stubApi({ [DETAIL]: fixture("joueur-complet.json") });
    const exams = await listPlayerExams("LIC1000");
    expect(exams.map((exam) => exam.date)).toEqual(["2026-05-14", "2026-04-28", "2026-02-10", "2025-12-02"]);
    const shot = exams[1].shots[0];
    expect(shot.id).toBe("12:399");
    expect(shot.position.x).toBeCloseTo((402 - 25) / 750, 5);
    expect(shot.zone).toBe("paint");
    expect(exams[2].shots.filter((s) => s.zone === null)).toHaveLength(1);
    expect(await countPlayerExams("LIC1000")).toBe(4);
  });

  it("isolation : examens invalides → seul l'onglet Examens échoue", async () => {
    stubApi({ [DETAIL]: fixture("joueur-examens-invalides.json") });
    await expect(listPlayerExams("LIC1000")).rejects.toBeInstanceOf(ZodError);
    await expect(getPlayerProfile("LIC1000", { includePersonalInfo: false })).resolves.not.toBeNull();
    await expect(listPlayerStatLines("LIC1000")).resolves.toHaveLength(27);
    await expect(countPlayerExams("LIC1000")).resolves.toBe(4);
  });

  it("isolation : stats invalides → profil et examens restent lisibles", async () => {
    stubApi({ [DETAIL]: fixture("joueur-stats-invalides.json") });
    await expect(listPlayerStatLines("LIC1000")).rejects.toBeInstanceOf(ZodError);
    await expect(getPlayerProfile("LIC1000", { includePersonalInfo: false })).resolves.not.toBeNull();
    await expect(listPlayerExams("LIC1000")).resolves.toHaveLength(4);
  });
});

describe("PhysicalRepository.getPhysicalRecord", () => {
  it("lit la forme PostgreSQL : alias de types, tri par date", async () => {
    stubApi({ "/physics/LIC1000": fixture("physics.json") });
    const record = await getPhysicalRecord("LIC1000");
    expect(record.unknownEntries).toEqual([]);
    expect(record.measurements).toHaveLength(9);
    expect(record.measurements[0]).toEqual({ id: "1", date: "2026-01-15", type: "height", value: 170 });
    expect(new Set(record.measurements.map((m) => m.type))).toEqual(new Set(["height", "verticalJump", "vma"]));
  });

  it("donne le même modèle avec la forme MySQL", async () => {
    stubApi({ "/physics/LIC1000": fixture("physics.json") });
    const postgres = await getPhysicalRecord("LIC1000");
    stubApi({ "/physics/LIC1000": fixture("physics-mysql.json") });
    const mysql = await getPhysicalRecord("LIC1000");
    const strip = (record: typeof postgres) => record.measurements.map(({ date, type, value }) => ({ date, type, value }));
    expect(strip(mysql)).toEqual(strip(postgres));
  });

  it("écarte et compte les types inconnus (P6)", async () => {
    stubApi({ "/physics/LIC1000": fixture("physics-type-inconnu.json") });
    const record = await getPhysicalRecord("LIC1000");
    expect(record.unknownEntries).toEqual([{ rawType: "Détente verticale", count: 1 }]);
    expect(record.measurements).toHaveLength(9);
  });

  it("refuse une date illisible", async () => {
    stubApi({ "/physics/LIC1000": [{ id: "1", type: "size", value: 180, date_physics: "12/03/2026" }] });
    await expect(getPhysicalRecord("LIC1000")).rejects.toBeInstanceOf(ZodError);
  });
});

describe("SeasonRepository.listParticipationSeasonIds / GameRepository", () => {
  it("renvoie les ids sans doublon, [] pour une licence inconnue", async () => {
    const seasons = loadFixture<unknown[]>("saisons-joueur.json", "home");
    stubApi({ "/saisons/LIC1000": [...seasons, seasons[0]], "/saisons/INCONNU": [] });
    expect(await listParticipationSeasonIds("LIC1000", "tok")).toEqual([4, 1]);
    expect(await listParticipationSeasonIds("INCONNU", "tok")).toEqual([]);
  });

  it("listAllGames donne tous les matchs, listSeasonGames ceux d'une saison", async () => {
    stubApi({ "/api/matchs": loadFixture("matchs.json", "calendar") });
    expect(await listAllGames()).toHaveLength(32);
    expect(await listSeasonGames(1)).toHaveLength(14);
  });
});
