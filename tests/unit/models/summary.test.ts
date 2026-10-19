import { describe, expect, it } from "vitest";
import { computeAverage } from "@/models/computeAverage";
import { computeSeasonSummary } from "@/models/computeSeasonSummary";
import type { RpbTeam } from "@/models/RpbTeam";
import { toCalendarGame } from "@/models/toCalendarGame";
import { makeGame } from "./factories";

const TODAY = "2026-02-15";
const RPB: RpbTeam = { id: 1, name: "RPB" };
const entry = (...args: Parameters<typeof makeGame>) => toCalendarGame(makeGame(...args), RPB, TODAY);

describe("computeAverage", () => {
  it("renvoie null sans match", () => {
    expect(computeAverage(10, 0)).toBeNull();
  });

  it("garde les décimales", () => {
    expect(computeAverage(10, 3)).toBeCloseTo(3.3333);
  });
});

describe("computeSeasonSummary", () => {
  it("liste vide : zéros et moyennes nulles", () => {
    expect(computeSeasonSummary([])).toEqual({
      scheduled: 0,
      remaining: 0,
      scoreMissing: 0,
      played: 0,
      unresolved: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      averageFor: null,
      averageAgainst: null,
      pointDifferential: 0,
      averageDifferential: null,
    });
  });

  it("bilan nominal", () => {
    const summary = computeSeasonSummary([
      entry(78, 65, "RPB", "A", { date: "2026-01-10" }),
      entry(70, 60, "B", "RPB", { date: "2026-01-17" }),
      entry(0, 0, "RPB", "C", { date: "2026-03-01" }),
    ]);
    expect(summary).toMatchObject({
      scheduled: 3,
      remaining: 1,
      played: 2,
      wins: 1,
      losses: 1,
      draws: 0,
      pointsFor: 138,
      pointsAgainst: 135,
      averageFor: 69,
      averageAgainst: 67.5,
      pointDifferential: 3,
      averageDifferential: 1.5,
    });
  });

  it("un nul compte dans les matchs joués et les points, ni victoire ni défaite", () => {
    const summary = computeSeasonSummary([entry(70, 70, "RPB", "A", { date: "2026-01-10" })]);
    expect(summary).toMatchObject({ played: 1, wins: 0, losses: 0, draws: 1, pointsFor: 70, pointsAgainst: 70 });
  });

  it("un 0-0 passé est exclu du bilan", () => {
    const summary = computeSeasonSummary([entry(0, 0, "RPB", "A", { date: "2026-01-10" })]);
    expect(summary).toMatchObject({ scheduled: 1, scoreMissing: 1, played: 0, averageFor: null });
  });

  it("un match où le RPB n'est pas reconnu est signalé et exclu des points", () => {
    const summary = computeSeasonSummary([
      entry(80, 50, "X", "Y", { date: "2026-01-10" }),
      entry(60, 40, "RPB", "A", { date: "2026-01-17" }),
    ]);
    expect(summary).toMatchObject({ played: 1, unresolved: 1, wins: 1, pointsFor: 60, pointsAgainst: 40 });
  });

  it("aucun match joué : moyennes nulles", () => {
    const summary = computeSeasonSummary([entry(0, 0, "RPB", "A", { date: "2026-03-01" })]);
    expect(summary).toMatchObject({ played: 0, remaining: 1, averageFor: null, averageDifferential: null });
  });
});
