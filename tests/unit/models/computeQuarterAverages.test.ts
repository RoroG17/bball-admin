import { describe, expect, it } from "vitest";
import { computeQuarterAverages } from "@/models/computeQuarterAverages";
import { makePlayerGameStats } from "./gameDetailFactories";

const club = (points: number, period = 1) =>
  makePlayerGameStats({ licence: "L1", periods: [{ period, twoPoints: { made: points / 2 } }] });
const opponent = makePlayerGameStats({ licence: "XXX", periods: [{ period: 1, twoPoints: { made: 50 } }] });

describe("computeQuarterAverages", () => {
  it("renvoie null sans match", () => {
    expect(computeQuarterAverages([])).toBeNull();
  });

  it("ne compte pas l'adversaire", () => {
    const averages = computeQuarterAverages([[club(10), opponent]]);
    expect(averages?.points).toEqual([10, 0, 0, 0]);
  });

  it("ignore un match sans joueur du club", () => {
    const averages = computeQuarterAverages([[club(10)], [opponent], []]);
    expect(averages?.points).toEqual([10, 0, 0, 0]);
  });

  it("fait la moyenne par match, quart-temps par quart-temps", () => {
    const averages = computeQuarterAverages([[club(10)], [club(20)], [club(8, 2)]]);
    expect(averages?.points[0]).toBeCloseTo(10);
    expect(averages?.points[1]).toBeCloseTo(8 / 3);
  });
});
