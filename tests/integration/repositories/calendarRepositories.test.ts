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

const { listSeasonGames } = await import("@/repositories/GameRepository");
const { resolveRpbTeam } = await import("@/repositories/TeamRepository");

type RawGame = Record<string, unknown>;
const matchs = loadFixture<RawGame[]>("matchs.json", "calendar");
const equipe = loadFixture("equipe.json", "calendar");

beforeEach(() => {
  cookieJar.value = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GameRepository.listSeasonGames", () => {
  it("ne garde que les matchs de la saison demandée", async () => {
    stubApi({ "/api/matchs": matchs });
    const games = await listSeasonGames(4);
    expect(games).toHaveLength(matchs.filter((m) => m.idSaison === 4).length);
    expect(games.every((g) => g.home.teamId === null && g.away.teamId === null)).toBe(true);
  });

  it("construit l'URL des logos, et null sans logo", async () => {
    stubApi({ "/api/matchs": matchs });
    const games = await listSeasonGames(4);
    expect(games.find((g) => g.id === 51)?.home.logoUrl).toBeNull();
    expect(games.find((g) => g.id === 36)?.home.logoUrl).toBe("http://api.test/public/images/logo/logo_frouzins.png");
  });

  it("accepte les nombres renvoyés en chaînes", async () => {
    stubApi({ "/api/matchs": [{ ...matchs[0], idSaison: "1", scoreDom: "36", idMatch: "1" }] });
    const [game] = await listSeasonGames(1);
    expect(game).toMatchObject({ id: 1, home: { score: 36 } });
  });

  it("rejette un format inattendu", async () => {
    stubApi({ "/api/matchs": { matchs } });
    await expect(listSeasonGames(4)).rejects.toBeInstanceOf(ZodError);
    const withoutSeason = { ...matchs[0] };
    delete withoutSeason.idSaison;
    stubApi({ "/api/matchs": [withoutSeason] });
    await expect(listSeasonGames(4)).rejects.toBeInstanceOf(ZodError);
  });

  it("remonte une erreur HTTP", async () => {
    stubApi({ "/api/matchs": { status: 500, body: {} } });
    await expect(listSeasonGames(4)).rejects.toMatchObject({ name: "ApiError", status: 500 });
  });

  it("envoie le token de la session", async () => {
    cookieJar.value = await signSessionToken({ username: "admin", licence: null, token: "tok" }, process.env.SESSION_SECRET!);
    const calls = stubApi({ "/api/matchs": matchs });
    await listSeasonGames(4);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });
});

describe("TeamRepository.resolveRpbTeam", () => {
  it("saison sans équipe : notConfigured, sans appel HTTP", async () => {
    const calls = stubApi({});
    await expect(resolveRpbTeam(null)).resolves.toEqual({ kind: "notConfigured" });
    expect(calls).toHaveLength(0);
  });

  it("équipe trouvée", async () => {
    stubApi({ "/api/equipes/1": equipe });
    await expect(resolveRpbTeam(1)).resolves.toEqual({ kind: "resolved", team: { id: 1, name: "FAC Basket" } });
  });

  it("équipe introuvable (404) : notConfigured", async () => {
    stubApi({});
    await expect(resolveRpbTeam(1)).resolves.toEqual({ kind: "notConfigured" });
  });

  it("erreur serveur ou format invalide : unavailable", async () => {
    stubApi({ "/api/equipes/1": { status: 500, body: {} } });
    await expect(resolveRpbTeam(1)).resolves.toEqual({ kind: "unavailable" });
    stubApi({ "/api/equipes/1": { nom: 42 } });
    await expect(resolveRpbTeam(1)).resolves.toEqual({ kind: "unavailable" });
  });

  it("l'échec de l'équipe n'empêche pas de charger les matchs", async () => {
    stubApi({ "/api/matchs": matchs, "/api/equipes/1": { status: 500, body: {} } });
    const [games, team] = await Promise.all([listSeasonGames(4), resolveRpbTeam(1)]);
    expect(games.length).toBeGreaterThan(0);
    expect(team).toEqual({ kind: "unavailable" });
  });
});

