import { describe, expect, it } from "vitest";
import { computeBarHeight } from "@/models/computeBarHeight";
import { computeChartScale } from "@/models/computeChartScale";
import { getBestQuarters } from "@/models/getBestQuarters";
import { sumQuarters } from "@/models/sumQuarters";

describe("sumQuarters", () => {
  it("additionne les 4 quarts-temps sans arrondir", () => {
    expect(sumQuarters([13.82, 15.18, 15.24, 14.06])).toBeCloseTo(58.3);
    expect(sumQuarters([0.1, 0.2, 0.3, 0.4])).toBeCloseTo(1);
  });
});

describe("getBestQuarters", () => {
  it("renvoie le meilleur quart-temps", () => {
    expect(getBestQuarters([13.8, 15.1, 15.2, 14])).toEqual([2]);
  });

  it("renvoie tous les ex æquo", () => {
    expect(getBestQuarters([4.6, 4.7, 4.6, 4.7])).toEqual([1, 3]);
  });

  it("ne désigne aucun meilleur quart-temps quand tout vaut 0", () => {
    expect(getBestQuarters([0, 0, 0, 0])).toEqual([]);
  });
});

describe("computeChartScale", () => {
  it("arrondit le max au multiple de 5 supérieur", () => {
    expect(computeChartScale([13.8, 15.2, 14, 12])).toBe(20);
    expect(computeChartScale([20, 3])).toBe(20);
  });

  it("vaut au moins 5", () => {
    expect(computeChartScale([0, 0])).toBe(5);
  });
});

describe("computeBarHeight", () => {
  it("est proportionnelle à l'échelle", () => {
    expect(computeBarHeight(10, 20)).toBe(64);
    expect(computeBarHeight(20, 20)).toBe(128);
  });

  it("vaut 0 pour une valeur nulle ou une échelle invalide", () => {
    expect(computeBarHeight(0, 20)).toBe(0);
    expect(computeBarHeight(5, 0)).toBe(0);
  });
});
