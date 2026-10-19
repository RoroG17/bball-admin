import { describe, expect, it } from "vitest";
import { assignRanks } from "@/models/assignRanks";
import { formatRankingValue } from "@/models/formatRankingValue";
import { getLeaders } from "@/models/getLeaders";
import { isSharedRank } from "@/models/isSharedRank";
import type { Ranking } from "@/models/Ranking";
import { RANKING_CATEGORIES, RANKING_CATEGORY_KEYS } from "@/models/RankingCategory";
import type { RankingEntry } from "@/models/RankingEntry";

const ranks = (values: number[]) => assignRanks(values.map((value) => ({ value }))).map((e) => e.rank);

function entry(licence: string, value: number, rank: number): RankingEntry {
  return { rank, value, total: null, player: { licence, firstName: licence, lastName: licence, photoUrl: null } };
}

describe("assignRanks", () => {
  it("numérote sans ex æquo", () => {
    expect(ranks([20, 18, 15])).toEqual([1, 2, 3]);
  });

  it("gère les ex æquo au milieu", () => {
    expect(ranks([20, 18, 18, 15])).toEqual([1, 2, 2, 4]);
  });

  it("gère les ex æquo en tête", () => {
    expect(ranks([4.29, 4.29, 4.18])).toEqual([1, 1, 3]);
  });

  it("gère une liste vide", () => {
    expect(ranks([])).toEqual([]);
  });

  it("conserve l'ordre et les champs d'origine", () => {
    expect(assignRanks([{ value: 2, id: "a" }, { value: 1, id: "b" }])).toEqual([
      { value: 2, id: "a", rank: 1 },
      { value: 1, id: "b", rank: 2 },
    ]);
  });
});

describe("isSharedRank", () => {
  const entries = [entry("a", 4.29, 1), entry("b", 4.29, 1), entry("c", 3, 3)];

  it("détecte les ex æquo", () => {
    expect(isSharedRank(entries, 0)).toBe(true);
    expect(isSharedRank(entries, 1)).toBe(true);
    expect(isSharedRank(entries, 2)).toBe(false);
  });
});

describe("RANKING_CATEGORIES", () => {
  it("contient les 9 catégories dans l'ordre des clés", () => {
    expect(RANKING_CATEGORIES.map((c) => c.key)).toEqual([...RANKING_CATEGORY_KEYS]);
  });

  it("n'inclut pas les ballons perdus dans les leaders", () => {
    const turnovers = RANKING_CATEGORIES.find((c) => c.key === "turnovers");
    expect(turnovers?.showInLeaders).toBe(false);
    expect(turnovers?.lowerIsBetter).toBe(true);
  });
});

describe("getLeaders", () => {
  const points = RANKING_CATEGORIES[0];
  const turnovers = RANKING_CATEGORIES[5];
  const rankings: Ranking[] = [
    { category: points, entries: [entry("a", 15, 1), entry("b", 15, 1), entry("c", 9, 3)] },
    { category: turnovers, entries: [entry("d", 4, 1)] },
  ];

  it("renvoie une tuile par joueur classé 1er, ex æquo compris, sans les ballons perdus", () => {
    expect(getLeaders(rankings).map((l) => l.entry.player.licence)).toEqual(["a", "b"]);
  });

  it("ignore les classements vides", () => {
    expect(getLeaders([{ category: points, entries: [] }])).toEqual([]);
  });
});

describe("formatRankingValue", () => {
  it("formate une moyenne et un pourcentage", () => {
    expect(formatRankingValue(18.44, "perGame")).toBe("18,4");
    expect(formatRankingValue(57.6, "percent")).toBe("58 %");
  });
});
