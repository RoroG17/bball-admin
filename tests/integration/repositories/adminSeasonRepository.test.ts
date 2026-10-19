import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ApiError } from "@/lib/ApiError";
import type { SeasonInput } from "@/models/SeasonInput";
import { loadFixture, stubApi } from "../helpers";

class NextControlError extends Error {}

const { getCurrentSession } = vi.hoisted(() => ({ getCurrentSession: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new NextControlError(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof NextControlError) throw error;
  },
}));
vi.mock("@/repositories/SessionRepository", () => ({ getCurrentSession }));
// `cache()` de React ne s'applique qu'à l'intérieur d'un rendu : ici, chaque appel relit la source.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const {
  addSeasonParticipantRecord,
  createSeasonRecord,
  deleteSeasonRecord,
  getSeasonById,
  listSeasonParticipantLicences,
  removeSeasonParticipantRecord,
  updateSeasonRecord,
} = await import("@/repositories/SeasonRepository");
const { countSeasonGames, getSeasonDeletionFacts } = await import("@/repositories/SeasonImpactRepository");

const D = "admin-season";
const show = loadFixture(`season-show-200.json`, D);
const matchs = loadFixture<{ idMatch: number; idSaison: number }[]>("matchs.json", "calendar");
const matchDetail = loadFixture("match-joue.json", "game-detail");
const matchSansStats = loadFixture("match-sans-stats.json", "game-detail");
const INPUT: SeasonInput = { startYear: 2026, endYear: 2027, championship: "Régionale 2", category: "Senior", teamId: 1 };

afterEach(() => {
  vi.unstubAllGlobals();
  getCurrentSession.mockReset();
});

describe("SeasonRepository.getSeasonById / listSeasonParticipantLicences", () => {
  it("200 : la saison et les licences, doublon du join absorbé", async () => {
    const calls = stubApi({ "/api/saisons/4": show });
    expect(await getSeasonById(4, "tok")).toEqual({
      id: 4,
      startYear: 2025,
      endYear: 2026,
      championship: "D1",
      category: "U15G",
      teamId: 1,
    });
    expect([...(await listSeasonParticipantLicences(4, "tok"))!]).toEqual(["LIC1000", "LIC2000", "LIC1002"]);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("equipe null → teamId null", async () => {
    stubApi({ "/api/saisons/5": loadFixture("season-show-team-null-200.json", D) });
    expect((await getSeasonById(5, "tok"))?.teamId).toBeNull();
  });

  it("404 : null pour la saison et pour les participants", async () => {
    stubApi({ "/api/saisons/99": { status: 404, body: loadFixture("season-show-404.json", D) } });
    expect(await getSeasonById(99, "tok")).toBeNull();
    expect(await listSeasonParticipantLicences(99, "tok")).toBeNull();
  });

  it("500 : lève (jamais de formulaire sur des données illisibles)", async () => {
    stubApi({ "/api/saisons/4": { status: 500, body: {} } });
    await expect(getSeasonById(4, "tok")).rejects.toBeInstanceOf(ApiError);
  });

  it("format invalide : lève", async () => {
    stubApi({ "/api/saisons/4": { saison: { Id_Saison: 4 }, participer: [] } });
    await expect(getSeasonById(4, "tok")).rejects.toBeInstanceOf(ZodError);
  });

  it("isolation des tranches : participer invalide n'empêche pas de lire la saison, et inversement", async () => {
    const valid = (show as { saison: unknown }).saison;
    stubApi({ "/api/saisons/4": { saison: valid, participer: [{ nom: "sans licence" }] } });
    expect((await getSeasonById(4, "tok"))?.id).toBe(4);
    await expect(listSeasonParticipantLicences(4, "tok")).rejects.toBeInstanceOf(ZodError);

    stubApi({ "/api/saisons/4": { saison: { oops: true }, participer: [{ licence: "LIC1000" }] } });
    await expect(getSeasonById(4, "tok")).rejects.toBeInstanceOf(ZodError);
    expect([...(await listSeasonParticipantLicences(4, "tok"))!]).toEqual(["LIC1000"]);
  });
});

describe("SeasonRepository : écritures", () => {
  it("createSeasonRecord : POST avec les noms du back, identifiant lu dans la réponse", async () => {
    const calls = stubApi({ "/api/saisons": { status: 201, body: loadFixture("season-create-201.json", D) } });
    const result = await createSeasonRecord(INPUT, "tok");
    expect(result).toEqual({ kind: "ok", value: { seasonId: 17 } });
    expect(calls[0]).toMatchObject({ method: "POST", path: "/api/saisons" });
    expect(JSON.parse(calls[0].body ?? "")).toEqual({
      annee_debut: 2026,
      annee_fin: 2027,
      championnat: "Régionale 2",
      categorie: "Senior",
      equipe: 1,
    });
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("création avec un corps illisible : ok, seasonId null (l'écriture est faite)", async () => {
    stubApi({ "/api/saisons": { status: 201, body: { surprise: true } } });
    expect(await createSeasonRecord(INPUT, "tok")).toEqual({ kind: "ok", value: { seasonId: null } });
  });

  it("updateSeasonRecord : PUT /api/saisons/{id} avec le corps complet", async () => {
    const calls = stubApi({ "/api/saisons/4": loadFixture("season-update-200.json", D) });
    const result = await updateSeasonRecord(4, INPUT, "tok");
    expect(result.kind).toBe("ok");
    expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/saisons/4" });
    expect(Object.keys(JSON.parse(calls[0].body ?? ""))).toEqual(["annee_debut", "annee_fin", "championnat", "categorie", "equipe"]);
  });

  it("422 → invalid avec les clés du back ; 404 → notFound ; 500 → failed", async () => {
    stubApi({ "/api/saisons": { status: 422, body: loadFixture("season-422-required.json", D) } });
    const invalid = await createSeasonRecord(INPUT, "tok");
    expect(invalid.kind).toBe("invalid");
    if (invalid.kind === "invalid") expect(Object.keys(invalid.errors)).toContain("annee_debut");

    stubApi({ "/api/saisons/4": { status: 404, body: loadFixture("season-show-404.json", D) } });
    expect((await updateSeasonRecord(4, INPUT, "tok")).kind).toBe("notFound");

    stubApi({ "/api/saisons": { status: 500, body: loadFixture("season-team-fk-500.json", D) } });
    expect(await createSeasonRecord(INPUT, "tok")).toEqual({ kind: "failed", reason: "server" });
  });

  it("rejet réseau → failed/network", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await createSeasonRecord(INPUT, "tok")).toEqual({ kind: "failed", reason: "network" });
  });

  it("deleteSeasonRecord : un seul DELETE sans corps", async () => {
    const calls = stubApi({ "/api/saisons/4": loadFixture("season-delete-200.json", D) });
    expect(await deleteSeasonRecord(4, "tok")).toEqual({ kind: "ok", value: null });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "DELETE", path: "/api/saisons/4", body: null });
  });

  it("addSeasonParticipantRecord : POST /api/participer { Id_Saison, licence } ; 422 → invalid", async () => {
    const calls = stubApi({ "/api/participer": { status: 201, body: loadFixture("participer-post-201.json", D) } });
    expect(await addSeasonParticipantRecord(4, "LIC1000", "tok")).toEqual({ kind: "ok", value: null });
    expect(calls[0]).toMatchObject({ method: "POST", path: "/api/participer" });
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ Id_Saison: 4, licence: "LIC1000" });

    stubApi({ "/api/participer": { status: 422, body: loadFixture("participer-post-422-exists.json", D) } });
    expect((await addSeasonParticipantRecord(4, "LIC1000", "tok")).kind).toBe("invalid");
  });

  it("removeSeasonParticipantRecord : DELETE /api/participer avec le couple dans le corps JSON", async () => {
    const calls = stubApi({ "/api/participer": loadFixture("participer-delete-200.json", D) });
    expect(await removeSeasonParticipantRecord(4, "LIC1000", "tok")).toEqual({ kind: "ok", value: null });
    expect(calls[0]).toMatchObject({ method: "DELETE", path: "/api/participer" });
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ Id_Saison: 4, licence: "LIC1000" });
    expect(calls[0].headers.get("Content-Type")).toBe("application/json");
  });
});

type Detail = { stats: unknown[] };

/** Faux back : matchs de la fixture du calendrier, détail d'un match selon `detail(id)` (`null` = 500). */
function stubGames(detail: (id: number) => Detail | null, extra: Record<string, unknown> = {}) {
  let running = 0;
  let peak = 0;
  const detailCalls: number[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const { pathname } = new URL(String(input));
      if (pathname in extra) return Response.json(extra[pathname]);
      if (pathname === "/api/matchs") return Response.json(matchs);
      const match = pathname.match(/^\/api\/matchs\/(\d+)$/);
      if (match) {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 2));
        running -= 1;
        detailCalls.push(Number(match[1]));
        const body = detail(Number(match[1]));
        return body === null ? new Response("{}", { status: 500 }) : Response.json(body);
      }
      return new Response("{}", { status: 404 });
    }),
  );
  return { peak: () => peak, detailCalls };
}

describe("SeasonImpactRepository", () => {
  const SEASON_1_GAMES = matchs.filter((game) => game.idSaison === 1);

  it("countSeasonGames : nombre de matchs de la saison, null si illisible", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    stubGames(() => matchDetail as Detail);
    expect(await countSeasonGames(1)).toBe(SEASON_1_GAMES.length);
    stubApi({ "/api/matchs": { status: 500, body: {} } });
    expect(await countSeasonGames(1)).toBeNull();
  });

  it("faits nominaux : matchs, participants distincts, somme des lignes de stats", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    stubGames(() => matchDetail as Detail, { "/api/saisons/1": show });
    const facts = await getSeasonDeletionFacts(1, "tok");
    expect(facts).toEqual({ gameCount: SEASON_1_GAMES.length, participantCount: 3, statLineCount: SEASON_1_GAMES.length * 10 });
  });

  it("concurrence limitée à 6 lectures simultanées", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    const probe = stubGames(() => matchDetail as Detail, { "/api/saisons/4": show });
    await getSeasonDeletionFacts(4, "tok");
    expect(probe.detailCalls).toHaveLength(matchs.filter((game) => game.idSaison === 4).length);
    expect(probe.peak()).toBeLessThanOrEqual(6);
    expect(probe.peak()).toBeGreaterThan(1);
  });

  it("aucun match : statLineCount 0 sans aucun appel de détail", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    const probe = stubGames(() => matchDetail as Detail, { "/api/saisons/77": show });
    const facts = await getSeasonDeletionFacts(77, "tok");
    expect(facts).toEqual({ gameCount: 0, participantCount: 3, statLineCount: 0 });
    expect(probe.detailCalls).toEqual([]);
  });

  it("match sans stats : 0 ligne, pas null", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    stubGames(() => matchSansStats as Detail, { "/api/saisons/1": show });
    expect((await getSeasonDeletionFacts(1, "tok")).statLineCount).toBe(0);
  });

  it("un seul match illisible : statLineCount null (jamais 0), le reste est conservé", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    const broken = SEASON_1_GAMES[3].idMatch;
    stubGames((id) => (id === broken ? null : (matchDetail as Detail)), { "/api/saisons/1": show });
    const facts = await getSeasonDeletionFacts(1, "tok");
    expect(facts.statLineCount).toBeNull();
    expect(facts.gameCount).toBe(SEASON_1_GAMES.length);
    expect(facts.participantCount).toBe(3);
  });

  it("matchs illisibles : lève ; participants en 404 : lève ApiError(404)", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    stubApi({ "/api/matchs": { status: 500, body: {} }, "/api/saisons/1": show });
    await expect(getSeasonDeletionFacts(1, "tok")).rejects.toBeInstanceOf(ApiError);

    stubGames(() => matchDetail as Detail);
    const missing = vi.mocked(fetch);
    const base = missing.getMockImplementation()!;
    missing.mockImplementation(async (input, init) =>
      new URL(String(input)).pathname === "/api/saisons/1" ? new Response("{}", { status: 404 }) : base(input, init),
    );
    await expect(getSeasonDeletionFacts(1, "tok")).rejects.toMatchObject({ status: 404 });
  });
});
