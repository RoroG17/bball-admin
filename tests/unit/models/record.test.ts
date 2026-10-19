import { describe, expect, it } from "vitest";
import { computeDonutArcs, DONUT_CIRCUMFERENCE } from "@/models/computeDonutArcs";
import { computeWinRate } from "@/models/computeWinRate";

describe("computeWinRate", () => {
  it("calcule le taux de victoire", () => {
    expect(computeWinRate({ wins: 8, losses: 3 })).toBeCloseTo(8 / 11);
  });

  it("renvoie null sans match", () => {
    expect(computeWinRate({ wins: 0, losses: 0 })).toBeNull();
  });

  it("renvoie 0 sans victoire", () => {
    expect(computeWinRate({ wins: 0, losses: 5 })).toBe(0);
  });
});

describe("computeDonutArcs", () => {
  it("n'a aucun arc sans match", () => {
    expect(computeDonutArcs({ wins: 0, losses: 0 })).toEqual({ win: null, loss: null });
  });

  it("dessine un seul arc plein quand il n'y a que des victoires ou que des défaites", () => {
    expect(computeDonutArcs({ wins: 4, losses: 0 }).loss).toBeNull();
    expect(computeDonutArcs({ wins: 0, losses: 4 }).win).toBeNull();
    expect(computeDonutArcs({ wins: 0, losses: 4 }).loss?.dashOffset).toBe(0);
  });

  it("sépare les deux arcs par un espace", () => {
    const { win, loss } = computeDonutArcs({ wins: 1, losses: 1 }, 2.5);
    const half = DONUT_CIRCUMFERENCE / 2;
    const [winLen, winRest] = win!.dashArray.split(" ").map(Number);
    const [lossLen] = loss!.dashArray.split(" ").map(Number);
    expect(winLen).toBeCloseTo(half - 2.5, 1);
    expect(winLen + winRest).toBeCloseTo(DONUT_CIRCUMFERENCE, 1);
    expect(lossLen).toBeCloseTo(half - 2.5, 1);
    expect(loss!.dashOffset).toBeCloseTo(-(half + 1.25), 1);
  });
});
