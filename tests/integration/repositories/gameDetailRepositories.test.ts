import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { signSessionToken } from "@/lib/sessionToken";
import { loadFixture, stubApi } from "../helpers";

const cookieJar = vi.hoisted(() => ({ value: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "bball_session" && cookieJar.value ? { name, value: cookieJar.value } : undefined),
  }),
}));

const { getGameDetail } = await import("@/repositories/GameRepository");
const { countGameStatLines, listGameStatLines } = await import("@/repositories/GameStatsRepository");
const { listGameShots } = await import("@/repositories/ShotRepository");

type Payload = { match: Record<string, unknown>; stats: Record<string, unknown>[] };
const fixture = (name: string) => loadFixture<Payload>(name, "game-detail");
const PATH = "/api/matchs/47";

beforeEach(() => {
  cookieJar.value = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GameRepository.getGameDetail", () => {
  it("renseigne les équipes, la saison et la vidéo", async () => {
    stubApi({ [PATH]: fixture("match-joue.json") });
    const detail = await getGameDetail(47);
    expect(detail).toMatchObject({
      seasonId: 4,
      video: { kind: "youtube", videoId: "t8QR6Oq4i5s" },
      game: { id: 47, number: 9, date: "2026-01-24", home: { teamId: 12, name: "OTB" }, away: { teamId: 1, score: 49 } },
    });
    expect(detail?.game.home.logoUrl).toBe("http://api.test/public/images/logo/logo_otb.png");
  });

  it("reconnaît les URL YouTube et signale un texte libre", async () => {
    stubApi({ [PATH]: fixture("match-video-url.json") });
    expect((await getGameDetail(47))?.video).toEqual({ kind: "youtube", videoId: "t8QR6Oq4i5s" });
    stubApi({ [PATH]: fixture("match-video-youtu-be.json") });
    expect((await getGameDetail(47))?.video).toEqual({ kind: "youtube", videoId: "t8QR6Oq4i5s" });
    stubApi({ [PATH]: fixture("match-video-invalide.json") });
    expect((await getGameDetail(47))?.video).toEqual({ kind: "invalid", raw: "pas une vidéo" });
    stubApi({ [PATH]: fixture("match-sans-stats.json") });
    expect((await getGameDetail(47))?.video).toEqual({ kind: "none" });
  });

  it("404 → null ; 500 → ApiError ; saison absente → ZodError", async () => {
    stubApi({ [PATH]: { status: 404, body: fixture("match-404.json") } });
    await expect(getGameDetail(47)).resolves.toBeNull();
    stubApi({ [PATH]: { status: 500, body: {} } });
    await expect(getGameDetail(47)).rejects.toMatchObject({ name: "ApiError", status: 500 });
    const payload = fixture("match-joue.json");
    delete payload.match.Id_Saison;
    stubApi({ [PATH]: payload });
    await expect(getGameDetail(47)).rejects.toBeInstanceOf(ZodError);
  });

  it("accepte les nombres renvoyés en chaînes", async () => {
    const payload = fixture("match-joue.json");
    Object.assign(payload.match, { idDom: "12", Id_Saison: "4" });
    payload.stats[0].q1_fautes = "2";
    stubApi({ [PATH]: payload });
    expect((await getGameDetail(47))?.game.home.teamId).toBe(12);
    expect((await listGameStatLines(47))[0].periods[0].fouls).toBe(2);
  });

  it("envoie le token de la session", async () => {
    cookieJar.value = await signSessionToken({ username: "admin", licence: null, token: "tok" }, process.env.SESSION_SECRET!);
    const calls = stubApi({ [PATH]: fixture("match-joue.json") });
    await getGameDetail(47);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });
});

describe("GameStatsRepository", () => {
  it("restructure les lignes en périodes", async () => {
    const payload = fixture("match-joue.json");
    stubApi({ [PATH]: payload });
    const lines = await listGameStatLines(47);
    expect(lines).toHaveLength(payload.stats.length);
    expect(lines.every((line) => line.periods.map((stats) => stats.period).join() === "1,2,3,4")).toBe(true);
    const last = lines[lines.length - 1];
    expect(last.periods[2].assists).toBeNull();
    expect(lines[0].player).toEqual({
      licence: "LIC1001",
      lastName: "BERNARD",
      firstName: "Hugo",
      photoUrl: "http://api.test/public/images/joueur/joueur-2.png",
    });
  });

  it("convertit les minutes", async () => {
    stubApi({ [PATH]: fixture("match-minutes.json") });
    const minutes = (await listGameStatLines(47)).slice(0, 4).map((line) => line.playingTimeSeconds);
    expect(minutes).toEqual([1453, 1920, null, null]);
  });

  it("P2 : aucune donnée personnelle ne sort du repository", async () => {
    stubApi({ [PATH]: fixture("match-joue-tirs.json") });
    const serialized = JSON.stringify(await listGameStatLines(47)) + JSON.stringify(await listGameShots(47));
    expect(serialized).not.toContain("2011-01-01");
    expect(serialized).not.toContain("date_physics");
    expect(serialized).not.toContain("civilite");
    expect(serialized).not.toContain("Id_Equipe");
  });

  it("compteur absent → ZodError", async () => {
    const payload = fixture("match-joue.json");
    delete payload.stats[0].q2_fautes;
    stubApi({ [PATH]: payload });
    await expect(listGameStatLines(47)).rejects.toBeInstanceOf(ZodError);
  });

  it("compte les lignes sans lever", async () => {
    stubApi({ [PATH]: fixture("match-joue.json") });
    await expect(countGameStatLines(47)).resolves.toBe(10);
    stubApi({ [PATH]: fixture("match-format-invalide.json") });
    await expect(countGameStatLines(47)).resolves.toBeNull();
    stubApi({ [PATH]: { status: 404, body: {} } });
    await expect(countGameStatLines(47)).resolves.toBeNull();
    await expect(listGameStatLines(47)).resolves.toEqual([]);
  });
});

describe("ShotRepository.listGameShots", () => {
  it("aplatit les tirs en repère normalisé", async () => {
    stubApi({ [PATH]: fixture("match-joue-tirs.json") });
    const shots = await listGameShots(47);
    expect(shots).toHaveLength(28);
    expect(shots[0].id).toMatch(/^\d+:00000000-/);
    expect(shots.every(({ position: { x, y } }) => x >= 0 && x <= 1 && y >= 0 && y <= 1)).toBe(true);
    expect(shots.some((shot) => shot.made)).toBe(true);
    expect(shots.some((shot) => !shot.made)).toBe(true);
  });

  it("aucun tir → liste vide", async () => {
    stubApi({ [PATH]: fixture("match-joue.json") });
    await expect(listGameShots(47)).resolves.toEqual([]);
  });
});

describe("isolation des tranches", () => {
  it("tirs invalides : seule la carte échoue", async () => {
    stubApi({ [PATH]: fixture("match-tirs-invalides.json") });
    await expect(listGameShots(47)).rejects.toBeInstanceOf(ZodError);
    await expect(listGameStatLines(47)).resolves.toHaveLength(10);
    await expect(getGameDetail(47)).resolves.not.toBeNull();
  });

  it("stats invalides : l'affiche reste lisible", async () => {
    stubApi({ [PATH]: fixture("match-format-invalide.json") });
    await expect(listGameStatLines(47)).rejects.toBeInstanceOf(ZodError);
    await expect(getGameDetail(47)).resolves.not.toBeNull();
  });
});
