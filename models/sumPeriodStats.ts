import { computePoints } from "@/models/computePoints";
import type { PeriodStats } from "@/models/PeriodStats";
import type { ShootingTotals, StatTotals } from "@/models/StatTotals";

const sum = (periods: readonly PeriodStats[], read: (stats: PeriodStats) => number | null) =>
  periods.reduce((total, stats) => total + (read(stats) ?? 0), 0);

function sumShots(periods: readonly PeriodStats[], key: "twoPoints" | "threePoints" | "freeThrows"): ShootingTotals {
  const made = sum(periods, (stats) => stats[key].made);
  return { made, attempted: made + sum(periods, (stats) => stats[key].missed) };
}

/** Somme des compteurs des périodes données (`null` compté 0). Liste vide → tout à 0. */
export function sumPeriodStats(periods: readonly PeriodStats[]): StatTotals {
  const offensiveRebounds = sum(periods, (stats) => stats.offensiveRebounds);
  const defensiveRebounds = sum(periods, (stats) => stats.defensiveRebounds);
  const twoPoints = sumShots(periods, "twoPoints");
  const threePoints = sumShots(periods, "threePoints");
  const freeThrows = sumShots(periods, "freeThrows");
  return {
    points: computePoints(twoPoints.made, threePoints.made, freeThrows.made),
    rebounds: offensiveRebounds + defensiveRebounds,
    offensiveRebounds,
    defensiveRebounds,
    assists: sum(periods, (stats) => stats.assists),
    steals: sum(periods, (stats) => stats.steals),
    blocks: sum(periods, (stats) => stats.blocks),
    turnovers: sum(periods, (stats) => stats.turnovers),
    fouls: sum(periods, (stats) => stats.fouls),
    twoPoints,
    threePoints,
    freeThrows,
    fieldGoals: {
      made: twoPoints.made + threePoints.made,
      attempted: twoPoints.attempted + threePoints.attempted,
    },
  };
}
