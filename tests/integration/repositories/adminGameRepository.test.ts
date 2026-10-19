import { afterEach, describe, expect, it, vi } from "vitest";
import { toCreateGamePayload, toUpdateGamePayload } from "@/repositories/dto/GamePayload";
import { loadFixture, stubApi } from "../helpers";

class NextControlError extends Error {}

const { getCurrentSession } = vi.hoisted(() => ({ getCurrentSession: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ "x-bball-path": "/admin/game" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new NextControlError(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof NextControlError) throw error;
  },
}));
vi.mock("@/repositories/SessionRepository", () => ({ getCurrentSession }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { createGameRecord, deleteGameRecord, listGamesAwaitingStats, updateGameRecord } = await import(
  "@/repositories/AdminGameRepository"
);

const D = "admin-game";
const VALUES = { seasonId: 4, round: 19, date: "2026-03-14", homeTeamId: 1, awayTeamId: 14 };

afterEach(() => {
  vi.unstubAllGlobals();
  getCurrentSession.mockReset();
});

describe("payloads", () => {
  it("création : ni score ni vidéo, nombres en number", () => {
    expect(toCreateGamePayload(VALUES)).toEqual({
      Id_Saison: 4,
      numero: 19,
      date_match: "2026-03-14",
      equipe_domicile: 1,
      equipe_exterieur: 14,
    });
  });
  it("modification : corps complet, vidéo nulle", () => {
    expect(toUpdateGamePayload({ ...VALUES, scores: { home: 0, away: 0 }, video: null })).toEqual({
      Id_Saison: 4,
      numero: 19,
      date_match: "2026-03-14",
      equipe_domicile: 1,
      equipe_exterieur: 14,
      score_domicile: 0,
      score_exterieur: 0,
      video: null,
    });
  });
});

describe("AdminGameRepository.createGameRecord", () => {
  it("201 : POST avec le jeton, identifiant lu", async () => {
    const calls = stubApi({ "/api/matchs": { status: 201, body: loadFixture("match-created-201.json", D) } });
    expect(await createGameRecord(VALUES, "tok")).toEqual({ kind: "ok", value: { id: 54 } });
    expect(calls[0]).toMatchObject({ method: "POST", path: "/api/matchs" });
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
    expect(JSON.parse(calls[0].body ?? "")).toEqual(toCreateGamePayload(VALUES));
  });
  it("réponse sans Id_Match : ok avec id nul", async () => {
    stubApi({ "/api/matchs": { status: 201, body: {} } });
    expect(await createGameRecord(VALUES, "tok")).toEqual({ kind: "ok", value: { id: null } });
  });
  it("422, 404 (avec message), 500, réseau", async () => {
    stubApi({ "/api/matchs": { status: 422, body: loadFixture("match-422-required.json", D) } });
    expect(await createGameRecord(VALUES, "tok")).toMatchObject({ kind: "invalid" });
    stubApi({ "/api/matchs": { status: 404, body: loadFixture("match-404-equipe.json", D) } });
    expect(await createGameRecord(VALUES, "tok")).toEqual({ kind: "notFound", backMessage: "L'équipe n'existe pas" });
    stubApi({ "/api/matchs": { status: 500, body: {} } });
    expect(await createGameRecord(VALUES, "tok")).toEqual({ kind: "failed", reason: "server" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await createGameRecord(VALUES, "tok")).toEqual({ kind: "failed", reason: "network" });
  });
  it("401 : redirection vers la session expirée", async () => {
    stubApi({ "/api/matchs": { status: 401, body: {} } });
    await expect(createGameRecord(VALUES, "tok")).rejects.toThrow("REDIRECT:");
  });
});

describe("AdminGameRepository.updateGameRecord / deleteGameRecord", () => {
  it("PUT complet sur le match", async () => {
    const calls = stubApi({ "/api/matchs/47": loadFixture("match-updated-200.json", D) });
    const input = { ...VALUES, scores: { home: 54, away: 50 }, video: "t8QR6Oq4i5s" };
    expect(await updateGameRecord(47, input, "tok")).toEqual({ kind: "ok", value: null });
    expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/matchs/47" });
    expect(JSON.parse(calls[0].body ?? "")).toMatchObject({ score_domicile: 54, score_exterieur: 50, video: "t8QR6Oq4i5s" });
  });
  it("PUT 404 : message du back conservé pour le classement", async () => {
    stubApi({ "/api/matchs/47": { status: 404, body: loadFixture("match-404.json", D) } });
    expect(await updateGameRecord(47, { ...VALUES, scores: { home: 0, away: 0 }, video: null }, "tok")).toEqual({
      kind: "notFound",
      backMessage: "Match non trouvé",
    });
  });
  it("DELETE : un seul appel, 500 = échec", async () => {
    const calls = stubApi({ "/api/matchs/47": loadFixture("match-delete-200.json", D) });
    expect(await deleteGameRecord(47, "tok")).toEqual({ kind: "ok", value: null });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("DELETE");
    stubApi({ "/api/matchs/47": { status: 500, body: loadFixture("match-delete-500-stats.json", D) } });
    expect(await deleteGameRecord(47, "tok")).toEqual({ kind: "failed", reason: "server" });
  });
});

describe("AdminGameRepository.listGamesAwaitingStats", () => {
  it("nominal : ensemble d'identifiants", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    const calls = stubApi({ "/api/matchs/review": loadFixture("matchs-review.json", D) });
    expect([...(await listGamesAwaitingStats())!]).toEqual([48, 41]);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });
  it("vide", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    stubApi({ "/api/matchs/review": loadFixture("matchs-review-vide.json", D) });
    expect([...(await listGamesAwaitingStats())!]).toEqual([]);
  });
  it("format invalide ou 500 : null, sans lever", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    stubApi({ "/api/matchs/review": loadFixture("matchs-review-invalide.json", D) });
    expect(await listGamesAwaitingStats()).toBeNull();
    stubApi({ "/api/matchs/review": { status: 500, body: {} } });
    expect(await listGamesAwaitingStats()).toBeNull();
  });
  it("401 : la redirection est relancée", async () => {
    getCurrentSession.mockResolvedValue({ token: "tok" });
    stubApi({ "/api/matchs/review": { status: 401, body: {} } });
    await expect(listGamesAwaitingStats()).rejects.toThrow("REDIRECT:");
  });
});
