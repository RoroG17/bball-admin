import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { RANKING_CATEGORY_KEYS } from "@/models/RankingCategory";
import { loadFixture, stubApi } from "../helpers";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

const { getPreviousAndNextGames, getSeasonRecord } = await import("@/repositories/GameRepository");
const { listSeasonRoster } = await import("@/repositories/PlayerRepository");
const { listSeasonRankings } = await import("@/repositories/RankingRepository");
const { getTeamName } = await import("@/repositories/TeamRepository");

const enCours = loadFixture<Record<string, unknown>>("accueil-en-cours.json");
const debut = loadFixture<Record<string, unknown>>("accueil-debut-saison.json");
const fin = loadFixture<Record<string, unknown>>("accueil-fin-saison.json");
const vide = loadFixture<Record<string, unknown>>("accueil-saison-vide.json");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GameRepository", () => {
  it("renvoie le match précédent et le suivant", async () => {
    stubApi({ "/accueil/4": enCours });
    const { previous, next } = await getPreviousAndNextGames(4);
    expect(previous).toEqual({
      id: 53,
      number: 18,
      date: "2026-05-09",
      home: { teamId: null, name: "FAC Basket", logoUrl: "http://api.test/public/images/logo/logo_frouzins.png", score: 69 },
      away: { teamId: null, name: "OTB", logoUrl: "http://api.test/public/images/logo/logo_otb.png", score: 72 },
    });
    expect(next).toMatchObject({ id: 54, home: { score: 0 }, away: { score: 0 } });
  });

  it("n'a pas de match précédent en début de saison", async () => {
    stubApi({ "/accueil/4": debut });
    const { previous, next } = await getPreviousAndNextGames(4);
    expect(previous).toBeNull();
    expect(next).not.toBeNull();
  });

  it("n'a pas de match suivant en fin de saison", async () => {
    stubApi({ "/accueil/4": fin });
    await expect(getPreviousAndNextGames(4)).resolves.toMatchObject({ next: null });
  });

  it("renvoie le bilan en nombre de matchs", async () => {
    stubApi({ "/accueil/4": enCours });
    await expect(getSeasonRecord(4)).resolves.toEqual({ wins: 11, losses: 7 });
  });
});

describe("PlayerRepository", () => {
  it("renvoie l'effectif trié par nom, avec l'URL des photos", async () => {
    stubApi({ "/accueil/4": enCours });
    const roster = await listSeasonRoster(4);
    expect(roster).toHaveLength(12);
    const names = roster.map((p) => p.lastName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "fr")));
    expect(roster[0].photoUrl).toMatch(/^http:\/\/api\.test\/public\/images\/joueur\/joueur-\d+\.png$/);
  });

  it("renvoie un effectif vide pour une saison vide", async () => {
    stubApi({ "/accueil/999": vide });
    await expect(listSeasonRoster(999)).resolves.toEqual([]);
  });
});

describe("RankingRepository", () => {
  it("renvoie les 9 classements dans l'ordre, avec des valeurs numériques", async () => {
    stubApi({ "/accueil/4": enCours });
    const rankings = await listSeasonRankings(4);
    expect(rankings.map((r) => r.category.key)).toEqual([...RANKING_CATEGORY_KEYS]);
    const points = rankings[0].entries[0];
    expect(points).toMatchObject({ rank: 1, value: 15.71, total: 267 });
  });

  it("attribue le même rang aux ex æquo", async () => {
    stubApi({ "/accueil/4": enCours });
    const turnovers = (await listSeasonRankings(4)).find((r) => r.category.key === "turnovers")!;
    expect(turnovers.entries.slice(0, 3).map((e) => [e.value, e.rank])).toEqual([
      [4.29, 1],
      [4.29, 1],
      [4.18, 3],
    ]);
  });

  it("retire le faux joueur « adversaire » (licence XXX) avant de calculer les rangs", async () => {
    const points = enCours.classPTSActuelle as Record<string, unknown>[];
    const opponent = { licence: "XXX", nom: "adversaire", prenom: "adversaire", photo: null, valeur: 99, total: 999 };
    stubApi({ "/accueil/4": { ...enCours, classPTSActuelle: [opponent, ...points] } });
    const entries = (await listSeasonRankings(4))[0].entries;
    expect(entries.map((entry) => entry.player.licence)).not.toContain("XXX");
    expect(entries[0]).toMatchObject({ rank: 1, value: 15.71, total: 267 });
  });

  it("renvoie des classements vides en début de saison", async () => {
    stubApi({ "/accueil/4": debut });
    const rankings = await listSeasonRankings(4);
    expect(rankings.every((r) => r.entries.length === 0)).toBe(true);
  });

  it("une tranche corrompue fait échouer son repository, pas les autres", async () => {
    stubApi({ "/accueil/4": { ...enCours, classPTSActuelle: "oops" } });
    await expect(listSeasonRankings(4)).rejects.toBeInstanceOf(ZodError);
    await expect(listSeasonRoster(4)).resolves.toHaveLength(12);
  });
});

describe("TeamRepository", () => {
  it("renvoie le nom de l'équipe", async () => {
    stubApi({ "/api/equipes/1": loadFixture("equipe.json") });
    await expect(getTeamName(1)).resolves.toBe("FAC Basket");
  });

  it("renvoie null sans équipe ou si elle n'existe pas", async () => {
    stubApi({});
    await expect(getTeamName(null)).resolves.toBeNull();
    await expect(getTeamName(42)).resolves.toBeNull();
  });
});
