import { describe, expect, it } from "vitest";
import { formatFixedDecimal, formatPercentPoints, formatPercentPointsFixed } from "@/lib/format";
import { assignHallOfFameRanks } from "@/models/assignHallOfFameRanks";
import { buildHallOfFameHref } from "@/models/buildHallOfFameHref";
import { isOpponentPlaceholder } from "@/models/isOpponentPlaceholder";
import { compareHallOfFameEntries, type UnrankedEntry } from "@/models/compareHallOfFameEntries";
import { describeHallOfFameMode } from "@/models/describeHallOfFameMode";
import { formatHallOfFameModeParam } from "@/models/formatHallOfFameModeParam";
import { formatHallOfFameValue } from "@/models/formatHallOfFameValue";
import { getAdjacentHallOfFameMode } from "@/models/getAdjacentHallOfFameMode";
import { getHallOfFameDigits } from "@/models/getHallOfFameDigits";
import { getPendingBackFix } from "@/models/getPendingBackFix";
import {
  HALL_OF_FAME_CATEGORIES,
  HALL_OF_FAME_CATEGORY_KEYS,
  type HallOfFameCategory,
} from "@/models/HallOfFameCategory";
import { HALL_OF_FAME_MODES, HALL_OF_FAME_MODE_PARAMS } from "@/models/HallOfFameMode";
import { isSharedRank } from "@/models/isSharedRank";
import { parseHallOfFameMode } from "@/models/parseHallOfFameMode";
import { roundToDigits } from "@/models/roundToDigits";

function entry(lastName: string, value: number, firstName = "Alex", licence = lastName.toUpperCase()): UnrankedEntry {
  return { player: { licence, lastName, firstName, photoUrl: null }, value };
}

function category(key: HallOfFameCategory["key"]): HallOfFameCategory {
  return HALL_OF_FAME_CATEGORIES.find((c) => c.key === key)!;
}

describe("parseHallOfFameMode", () => {
  it("renvoie le mode par défaut pour une valeur absente, vide ou inconnue", () => {
    expect(parseHallOfFameMode(undefined)).toBe("bestGame");
    expect(parseHallOfFameMode(null)).toBe("bestGame");
    expect(parseHallOfFameMode("")).toBe("bestGame");
    expect(parseHallOfFameMode("xyz")).toBe("bestGame");
    expect(parseHallOfFameMode("Carriere")).toBe("bestGame");
  });

  it("reconnaît chacune des 5 valeurs", () => {
    for (const mode of HALL_OF_FAME_MODES) expect(parseHallOfFameMode(HALL_OF_FAME_MODE_PARAMS[mode])).toBe(mode);
  });
});

describe("formatHallOfFameModeParam et buildHallOfFameHref", () => {
  it("n'écrit aucun paramètre pour le mode par défaut", () => {
    expect(formatHallOfFameModeParam("bestGame")).toBeNull();
    expect(buildHallOfFameHref("bestGame")).toBe("/hall-of-fame");
  });

  it("écrit ?mode= pour les autres modes", () => {
    expect(formatHallOfFameModeParam("career")).toBe("carriere");
    expect(buildHallOfFameHref("career")).toBe("/hall-of-fame?mode=carriere");
  });

  it("conserve les autres paramètres et ignore le mode qu'ils contiennent", () => {
    expect(buildHallOfFameHref("bestSeason", new URLSearchParams("x=1&mode=carriere"))).toBe(
      "/hall-of-fame?mode=saison&x=1",
    );
    expect(buildHallOfFameHref("bestGame", new URLSearchParams("x=1&mode=carriere"))).toBe("/hall-of-fame?x=1");
  });

  it("fait l'aller-retour avec parseHallOfFameMode pour les 5 modes", () => {
    for (const mode of HALL_OF_FAME_MODES) {
      const param = new URL(buildHallOfFameHref(mode), "http://x").searchParams.get("mode");
      expect(parseHallOfFameMode(param)).toBe(mode);
    }
  });
});

describe("getAdjacentHallOfFameMode", () => {
  it("boucle dans les deux sens", () => {
    expect(getAdjacentHallOfFameMode("bestGame", "next")).toBe("averagePerGame");
    expect(getAdjacentHallOfFameMode("career", "next")).toBe("bestGame");
    expect(getAdjacentHallOfFameMode("bestGame", "previous")).toBe("career");
    expect(getAdjacentHallOfFameMode("bestSeason", "previous")).toBe("averagePerGame");
  });

  it("va au premier et au dernier", () => {
    expect(getAdjacentHallOfFameMode("bestSeason", "first")).toBe("bestGame");
    expect(getAdjacentHallOfFameMode("bestSeason", "last")).toBe("career");
  });
});

describe("compareHallOfFameEntries", () => {
  it("trie par valeur décroissante", () => {
    const sorted = [entry("A", 10), entry("B", 30), entry("C", 20)].sort(compareHallOfFameEntries);
    expect(sorted.map((e) => e.value)).toEqual([30, 20, 10]);
  });

  it("départage les ex æquo par nom, prénom puis licence, accents compris", () => {
    const list = [
      entry("Zola", 5, "Zoé"),
      entry("Zola", 5, "Élodie"),
      entry("Martin", 5, "Alex", "L2"),
      entry("Martin", 5, "Alex", "L1"),
    ];
    const names = [...list].sort(compareHallOfFameEntries).map((e) => `${e.player.lastName} ${e.player.firstName} ${e.player.licence}`);
    expect(names).toEqual(["Martin Alex L1", "Martin Alex L2", "Zola Élodie ZOLA", "Zola Zoé ZOLA"]);
  });

  it("donne le même résultat quel que soit l'ordre d'entrée", () => {
    const list = [entry("D", 5), entry("B", 5), entry("A", 9), entry("C", 5)];
    const reversed = [...list].reverse();
    expect([...list].sort(compareHallOfFameEntries)).toEqual([...reversed].sort(compareHallOfFameEntries));
  });
});

describe("roundToDigits", () => {
  it("arrondit à la décimale demandée", () => {
    expect(roundToDigits(72.65, 1)).toBe(72.7);
    expect(roundToDigits(12, 0)).toBe(12);
    expect(roundToDigits(0, 1)).toBe(0);
    expect(roundToDigits(99.95, 1)).toBe(100);
    expect(roundToDigits(12.4, 0)).toBe(12);
  });
});

describe("getHallOfFameDigits", () => {
  it("donne 1 décimale aux pourcentages dans les 5 modes", () => {
    for (const key of ["fieldGoalPct", "threePointPct", "freeThrowPct"] as const) {
      for (const mode of HALL_OF_FAME_MODES) expect(getHallOfFameDigits(category(key), mode)).toBe(1);
    }
  });

  it("donne 0 aux volumes, sauf les deux moyennes (1)", () => {
    const expected = [0, 1, 0, 1, 0];
    for (const key of ["points", "assists", "rebounds", "steals", "blocks", "turnovers"] as const) {
      expect(HALL_OF_FAME_MODES.map((mode) => getHallOfFameDigits(category(key), mode))).toEqual(expected);
    }
  });
});

describe("assignHallOfFameRanks", () => {
  it("classe en compétition : 20, 18, 18, 15 → 1, 2, 2, 4", () => {
    const ranked = assignHallOfFameRanks([entry("A", 20), entry("B", 18), entry("C", 18), entry("D", 15)], 0);
    expect(ranked.map((e) => e.rank)).toEqual([1, 2, 2, 4]);
  });

  it("calcule le rang sur la valeur arrondie et garde la valeur brute", () => {
    const ranked = assignHallOfFameRanks([entry("A", 72.64), entry("B", 72.58), entry("C", 70)], 1);
    expect(ranked.map((e) => e.rank)).toEqual([1, 1, 3]);
    expect(ranked.map((e) => e.value)).toEqual([72.64, 72.58, 70]);
  });

  it("arrondit à 0 décimale quand le mode l'exige", () => {
    const ranked = assignHallOfFameRanks([entry("A", 12.4), entry("B", 12.2)], 0);
    expect(ranked.map((e) => e.rank)).toEqual([1, 1]);
  });

  it("gère liste vide, un seul joueur et dix ex æquo, sans tronquer", () => {
    expect(assignHallOfFameRanks([], 1)).toEqual([]);
    expect(assignHallOfFameRanks([entry("A", 5)], 0).map((e) => e.rank)).toEqual([1]);
    const ties = Array.from({ length: 12 }, (_, i) => entry(`N${String(i).padStart(2, "0")}`, 7));
    const ranked = assignHallOfFameRanks(ties, 0);
    expect(ranked).toHaveLength(12);
    expect(new Set(ranked.map((e) => e.rank))).toEqual(new Set([1]));
  });

  it("ne dépend pas de l'ordre d'entrée", () => {
    const list = [entry("C", 5), entry("A", 5), entry("B", 9)];
    expect(assignHallOfFameRanks(list, 0)).toEqual(assignHallOfFameRanks([...list].reverse(), 0));
  });
});

describe("formatHallOfFameValue", () => {
  const NBSP = " ";

  it("formate les pourcentages à 1 décimale avec espace insécable", () => {
    expect(formatHallOfFameValue(72.6, category("fieldGoalPct"), "career")).toBe(`72,6${NBSP}%`);
    expect(formatHallOfFameValue(100, category("freeThrowPct"), "bestGame")).toBe(`100,0${NBSP}%`);
    expect(formatHallOfFameValue(0, category("threePointPct"), "bestSeason")).toBe(`0,0${NBSP}%`);
  });

  it("formate les volumes selon le mode", () => {
    expect(formatHallOfFameValue(32, category("points"), "bestGame")).toBe("32");
    expect(formatHallOfFameValue(12.5, category("points"), "averagePerGame")).toBe("12,5");
    expect(formatHallOfFameValue(12, category("points"), "averagePerGame")).toBe("12,0");
    expect(formatHallOfFameValue(1480, category("points"), "career")).toMatch(/^1\s480$/);
  });

  it("n'affiche jamais NaN", () => {
    expect(formatHallOfFameValue(Number.NaN, category("points"), "bestGame")).toBe("—");
    expect(formatHallOfFameValue(Number.POSITIVE_INFINITY, category("fieldGoalPct"), "bestGame")).toBe("—");
  });
});

describe("describeHallOfFameMode", () => {
  it("donne un sous-titre distinct pour chacune des 10 combinaisons", () => {
    const texts = HALL_OF_FAME_MODES.flatMap((mode) => [
      describeHallOfFameMode(mode, "volume"),
      describeHallOfFameMode(mode, "percent"),
    ]);
    expect(new Set(texts).size).toBe(10);
    expect(describeHallOfFameMode("averagePerSeason", "volume")).toContain("et non par match");
  });
});

describe("getPendingBackFix", () => {
  it("signale B1, B2 et B3 sur les cartes concernées", () => {
    expect(getPendingBackFix("fieldGoalPct", "bestGame")?.id).toBe("B1");
    expect(getPendingBackFix("threePointPct", "averagePerGame")?.id).toBe("B2");
    expect(getPendingBackFix("freeThrowPct", "averagePerSeason")?.id).toBe("B3");
  });

  it("ne signale rien ailleurs", () => {
    expect(getPendingBackFix("points", "bestGame")).toBeNull();
    expect(getPendingBackFix("threePointPct", "bestGame")).toBeNull();
    expect(getPendingBackFix("fieldGoalPct", "career")).toBeNull();
  });
});

describe("HALL_OF_FAME_CATEGORIES", () => {
  it("compte 9 clés uniques dans l'ordre d'affichage", () => {
    expect(HALL_OF_FAME_CATEGORIES.map((c) => c.key)).toEqual([...HALL_OF_FAME_CATEGORY_KEYS]);
    expect(new Set(HALL_OF_FAME_CATEGORIES.map((c) => c.key)).size).toBe(9);
  });

  it("marque uniquement les ballons perdus comme « moins = mieux »", () => {
    expect(HALL_OF_FAME_CATEGORIES.filter((c) => c.lowerIsBetter).map((c) => c.key)).toEqual(["turnovers"]);
  });
});

describe("isSharedRank", () => {
  it("détecte un rang partagé avec le voisin, sans autre champ que le rang", () => {
    const entries = [{ rank: 1 }, { rank: 2 }, { rank: 2 }, { rank: 4 }];
    expect(entries.map((_, index) => isSharedRank(entries, index))).toEqual([false, true, true, false]);
  });
});

describe("formatFixedDecimal et formatPercentPointsFixed", () => {
  it("garde des décimales fixes en fr-FR", () => {
    expect(formatFixedDecimal(12, 1)).toBe("12,0");
    expect(formatFixedDecimal(12.54, 1)).toBe("12,5");
    expect(formatFixedDecimal(12.4, 0)).toBe("12");
    expect(formatPercentPointsFixed(72.64)).toBe("72,6 %");
  });

  it("laisse formatPercentPoints (accueil) inchangé", () => {
    expect(formatPercentPoints(57.6)).toBe("58 %");
  });
});

describe("isOpponentPlaceholder", () => {
  it("reconnaît le faux joueur « adversaire » par sa licence XXX", () => {
    expect(isOpponentPlaceholder({ licence: "XXX" })).toBe(true);
    expect(isOpponentPlaceholder({ licence: " xxx " })).toBe(true);
  });

  it("ne retire aucun vrai joueur", () => {
    expect(isOpponentPlaceholder({ licence: "LIC1000" })).toBe(false);
    expect(isOpponentPlaceholder({ licence: "XXX1" })).toBe(false);
  });
});
