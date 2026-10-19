import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ApiError } from "@/lib/ApiError";
import { HALL_OF_FAME_CATEGORY_KEYS } from "@/models/HallOfFameCategory";
import { HALL_OF_FAME_MODES } from "@/models/HallOfFameMode";
import { loadFixture, stubApi } from "../helpers";

const { getCurrentSession } = vi.hoisted(() => ({ getCurrentSession: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/repositories/SessionRepository", () => ({ getCurrentSession }));
// `cache()` de React ne s'applique qu'à l'intérieur d'un rendu : ici, chaque appel relit la source.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { getHallOfFameStat, hasHallOfFameRecords } = await import("@/repositories/HallOfFameRepository");

const nominal = loadFixture("history-nominal.json", "hall-of-fame");
const chaine = loadFixture("history-valeurs-chaine.json", "hall-of-fame");
const exAequo = loadFixture("history-ex-aequo.json", "hall-of-fame");
const moinsDeDix = loadFixture("history-moins-de-10.json", "hall-of-fame");
const photoNull = loadFixture("history-photo-null.json", "hall-of-fame");
const valeurNull = loadFixture("history-valeur-null.json", "hall-of-fame");
const vide = loadFixture("history-vide.json", "hall-of-fame");
const trancheInvalide = loadFixture("history-tranche-invalide.json", "hall-of-fame");
const formeInvalide = loadFixture("history-forme-invalide.json", "hall-of-fame");

const SESSION = { username: "admin", licence: null, role: "admin", token: "tok" };

function serve(body: unknown) {
  getCurrentSession.mockResolvedValue(SESSION);
  return stubApi({ "/api/history": body });
}

afterEach(() => {
  vi.unstubAllGlobals();
  getCurrentSession.mockReset();
});

describe("getHallOfFameStat", () => {
  it("renvoie les 5 modes de chaque catégorie, rangs croissants", async () => {
    serve(nominal);
    for (const key of HALL_OF_FAME_CATEGORY_KEYS) {
      const stat = await getHallOfFameStat(key);
      expect(stat.category.key).toBe(key);
      for (const mode of HALL_OF_FAME_MODES) {
        const entries = stat.rankings[mode];
        expect(entries).toHaveLength(10);
        expect(entries.map((e) => e.rank)).toEqual([...entries.map((e) => e.rank)].sort((a, b) => a - b));
        expect(entries.every((e) => Number.isFinite(e.value))).toBe(true);
      }
    }
  });

  it("retire le faux joueur « adversaire » (licence XXX) avant de calculer les rangs", async () => {
    const withOpponent = structuredClone(nominal) as {
      rankings: Record<string, Record<string, { licence: string; nom: string; prenom: string; valeur: unknown }[]>>;
    };
    withOpponent.rankings.points.max_game.unshift({ licence: "XXX", nom: "adversaire", prenom: "adversaire", valeur: 99 });
    serve(withOpponent);
    const entries = (await getHallOfFameStat("points")).rankings.bestGame;
    expect(entries.map((entry) => entry.player.licence)).not.toContain("XXX");
    expect(entries[0]).toMatchObject({ rank: 1, player: { licence: "LIC1000" }, value: 38 });
  });

  it("accepte `valeur` en chaîne numérique (« 12.50 ») sans la transformer en 0", async () => {
    serve(chaine);
    const stat = await getHallOfFameStat("points");
    expect(stat.rankings.averagePerGame[0].value).toBeCloseTo(17.4);
    expect(typeof stat.rankings.averagePerGame[0].value).toBe("number");
  });

  it("invalide la tranche si `valeur` est une chaîne non numérique, sans toucher aux autres catégories", async () => {
    serve(trancheInvalide);
    await expect(getHallOfFameStat("rebounds")).rejects.toBeInstanceOf(ZodError);
    await expect(getHallOfFameStat("points")).resolves.toMatchObject({ category: { key: "points" } });
  });

  it("rejette un négatif et un pourcentage supérieur à 100", async () => {
    const negatif = structuredClone(nominal) as { rankings: Record<string, Record<string, { valeur: unknown }[]>> };
    negatif.rankings.points.max_game[0].valeur = -1;
    negatif.rankings.field_goal_percentage.career_total[0].valeur = 101;
    serve(negatif);
    await expect(getHallOfFameStat("points")).rejects.toBeInstanceOf(ZodError);
    await expect(getHallOfFameStat("fieldGoalPct")).rejects.toBeInstanceOf(ZodError);
  });

  it("lève une ZodError quand la catégorie est absente de la réponse", async () => {
    serve({ rankings: {} });
    await expect(getHallOfFameStat("points")).rejects.toBeInstanceOf(ZodError);
  });

  it("écarte les entrées sans valeur au lieu de les classer à 0", async () => {
    serve(valeurNull);
    const entries = (await getHallOfFameStat("points")).rankings.bestGame;
    expect(entries.map((e) => e.value)).toEqual([38, 30, 29]);
    expect(entries.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it("partage le rang des ex æquo, avec un tri déterministe", async () => {
    serve(exAequo);
    const points = (await getHallOfFameStat("points")).rankings.bestGame;
    expect(points.map((e) => e.rank)).toEqual([1, 1, 3, 4, 4, 4, 7, 8, 9, 10]);
    const fieldGoal = (await getHallOfFameStat("fieldGoalPct")).rankings.career;
    expect(fieldGoal.slice(0, 3).map((e) => e.rank)).toEqual([1, 1, 3]);
    expect(fieldGoal[3].rank).toBe(4);
    expect(fieldGoal[4].rank).toBe(4);
    const assists = (await getHallOfFameStat("assists")).rankings.bestGame;
    expect(new Set(assists.map((e) => e.rank))).toEqual(new Set([1]));
    // Même nom de famille : départage par prénom puis licence, jamais par l'ordre d'arrivée.
    expect(assists.map((e) => e.player.licence)).toEqual(
      [...assists].sort((a, b) => a.player.firstName.localeCompare(b.player.firstName, "fr") || a.player.licence.localeCompare(b.player.licence)).map((e) => e.player.licence),
    );
  });

  it("résout l'URL de la photo, ou null si elle est absente", async () => {
    serve(photoNull);
    const entries = (await getHallOfFameStat("points")).rankings.bestGame;
    expect(entries[0].player.photoUrl).toBeNull();
    expect(entries[1].player.photoUrl).toBeNull();
    expect(entries[2].player.photoUrl).toBe("http://api.test/public/images/joueur/lefebvre.jpg".replace("lefebvre", "hugo"));
  });

  it("garde les listes de moins de 10 entrées, y compris vides", async () => {
    serve(moinsDeDix);
    const stat = await getHallOfFameStat("points");
    expect(stat.rankings.bestGame).toEqual([]);
    expect(stat.rankings.averagePerGame).toHaveLength(1);
    expect(stat.rankings.bestSeason).toHaveLength(3);
  });

  it("envoie le jeton de session en Bearer vers /api/history", async () => {
    const calls = serve(nominal);
    await getHallOfFameStat("points");
    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe("/api/history");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("n'émet aucun appel sans session", async () => {
    const calls = stubApi({ "/api/history": nominal });
    getCurrentSession.mockResolvedValue(null);
    await expect(getHallOfFameStat("points")).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe("hasHallOfFameRecords", () => {
  it("est vrai quand au moins une liste contient un joueur", async () => {
    serve(nominal);
    await expect(hasHallOfFameRecords()).resolves.toBe(true);
  });

  it("est faux pour une base sans statistiques", async () => {
    serve(vide);
    await expect(hasHallOfFameRecords()).resolves.toBe(false);
  });

  it("lève quand la forme générale est invalide (panne globale)", async () => {
    serve(formeInvalide);
    await expect(hasHallOfFameRecords()).rejects.toBeInstanceOf(ZodError);
  });

  it("lève une ApiError sur une réponse 500", async () => {
    getCurrentSession.mockResolvedValue(SESSION);
    stubApi({ "/api/history": { status: 500, body: { message: "boom" } } });
    await expect(hasHallOfFameRecords()).rejects.toBeInstanceOf(ApiError);
  });
});
