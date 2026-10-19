import { describe, expect, it } from "vitest";
import { computePoints } from "@/models/computePoints";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import { computeTeamPeriodTotals } from "@/models/computeTeamPeriodTotals";
import { computeTeamTotals } from "@/models/computeTeamTotals";
import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import { formatPeriodList } from "@/models/formatPeriodList";
import { formatPeriodParam } from "@/models/formatPeriodParam";
import { getTeamStatValue } from "@/models/getTeamStatValue";
import { listGamePeriods } from "@/models/listGamePeriods";
import { parsePeriodSelection } from "@/models/parsePeriodSelection";
import { parsePlayingTime } from "@/models/parsePlayingTime";
import { selectPeriods } from "@/models/selectPeriods";
import { sumPeriodStats } from "@/models/sumPeriodStats";
import { TEAM_STATS } from "@/models/TeamStat";
import { makePeriodStats, makePlayerGameStats } from "./gameDetailFactories";

describe("computePoints / computeShootingPercentage", () => {
  it("compte 2, 3 et 1 point", () => {
    expect(computePoints(4, 2, 3)).toBe(17);
  });

  it("donne un ratio sans arrondi, null sans tentative", () => {
    expect(computeShootingPercentage(12, 31)).toBeCloseTo(0.3871, 4);
    expect(computeShootingPercentage(3, 3)).toBe(1);
    expect(computeShootingPercentage(0, 0)).toBeNull();
  });
});

describe("selectPeriods / sumPeriodStats", () => {
  const periods = [
    makePeriodStats({ period: 1, offensiveRebounds: 1, defensiveRebounds: 2, twoPoints: { made: 2, missed: 1 } }),
    makePeriodStats({ period: 2, assists: null, threePoints: { made: 1, missed: null }, freeThrows: { made: 1, missed: 1 } }),
  ];

  it("sélectionne toutes les périodes ou une seule", () => {
    expect(selectPeriods(periods, "all")).toHaveLength(2);
    expect(selectPeriods(periods, 2).map((stats) => stats.period)).toEqual([2]);
    expect(selectPeriods(periods, 3)).toEqual([]);
  });

  it("additionne en comptant null pour 0", () => {
    const totals = sumPeriodStats(periods);
    expect(totals).toMatchObject({
      points: 2 * 2 + 3 + 1,
      rebounds: 3,
      offensiveRebounds: 1,
      defensiveRebounds: 2,
      assists: 0,
      twoPoints: { made: 2, attempted: 3 },
      threePoints: { made: 1, attempted: 1 },
      freeThrows: { made: 1, attempted: 2 },
      fieldGoals: { made: 3, attempted: 4 },
    });
  });

  it("liste vide → zéros", () => {
    expect(sumPeriodStats([])).toMatchObject({ points: 0, rebounds: 0, fieldGoals: { made: 0, attempted: 0 } });
  });
});

describe("computeTeamTotals / computeTeamPeriodTotals / getTeamStatValue", () => {
  const lines = [
    makePlayerGameStats({ lineId: 1, periods: [{ period: 1, twoPoints: { made: 2 } }, { period: 3, fouls: 2 }] }),
    makePlayerGameStats({ lineId: 2, periods: [{ period: 1, twoPoints: { made: 1 } }] }),
  ];

  it("compte toutes les lignes, doublons compris", () => {
    const duplicate = [...lines, { ...lines[0], lineId: 3 }];
    expect(computeTeamTotals(duplicate, "all").points).toBe(10);
    expect(computeTeamTotals(lines, 1).points).toBe(6);
  });

  it("une entrée par période, zéros si vide", () => {
    const perPeriod = computeTeamPeriodTotals(lines, [1, 2, 3, 4]);
    expect(perPeriod.map(({ period, totals }) => [period, totals.points, totals.fouls])).toEqual([
      [1, 6, 0],
      [2, 0, 0],
      [3, 0, 2],
      [4, 0, 0],
    ]);
  });

  it("lit les 7 stats d'équipe", () => {
    const totals = computeTeamTotals(lines, "all");
    expect(TEAM_STATS.map((stat) => getTeamStatValue(totals, stat))).toEqual([6, 0, 0, 0, 0, 0, 2]);
  });
});

describe("périodes", () => {
  it("toujours Q1 à Q4, plus les prolongations", () => {
    expect(listGamePeriods([])).toEqual([1, 2, 3, 4]);
    const withOvertime = makePlayerGameStats();
    withOvertime.periods.push(makePeriodStats({ period: 5 }));
    expect(listGamePeriods([withOvertime])).toEqual([1, 2, 3, 4, 5]);
  });

  it("libellés courts et longs", () => {
    expect(formatPeriodLabel(3)).toBe("Q3");
    expect(formatPeriodLabel(3, "long")).toBe("Quart-temps 3");
    expect(formatPeriodLabel(5)).toBe("Prol. 1");
    expect(formatPeriodLabel(5, "long")).toBe("Prolongation 1");
    expect(formatPeriodList([2, 3])).toBe("Q2 et Q3");
    expect(formatPeriodList([1, 2, 5])).toBe("Q1, Q2 et Prol. 1");
    expect(formatPeriodList([4])).toBe("Q4");
  });

  it("paramètre d'URL", () => {
    const periods = [1, 2, 3, 4];
    expect(parsePeriodSelection("q3", periods)).toBe(3);
    expect(parsePeriodSelection("Q3", periods)).toBe(3);
    expect(parsePeriodSelection("tout", periods)).toBe("all");
    expect(parsePeriodSelection("q9", periods)).toBe("all");
    expect(parsePeriodSelection(null, periods)).toBe("all");
    expect(formatPeriodParam("all")).toBeNull();
    expect(formatPeriodParam(2)).toBe("q2");
    expect(parsePeriodSelection(formatPeriodParam(4), periods)).toBe(4);
  });
});

describe("parsePlayingTime", () => {
  it.each([
    ["00:24:13", 1453],
    ["01:02:03", 3723],
    ["32", 1920],
    ["0", 0],
  ])("%s → %d s", (raw, seconds) => {
    expect(parsePlayingTime(raw)).toBe(seconds);
  });

  it.each([null, "", "abc", "24:13"])("%j → null", (raw) => {
    expect(parsePlayingTime(raw)).toBeNull();
  });
});
