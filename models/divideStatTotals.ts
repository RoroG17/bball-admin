import type { ShootingTotals, StatTotals } from "@/models/StatTotals";

const divideShots = (totals: ShootingTotals, divisor: number): ShootingTotals => ({
  made: totals.made / divisor,
  attempted: totals.attempted / divisor,
});

/** Chaque compteur divisé par `divisor`, sans arrondi. `divisor <= 0` : `RangeError` (les appelants garantissent `> 0`). */
export function divideStatTotals(totals: StatTotals, divisor: number): StatTotals {
  if (divisor <= 0) throw new RangeError("Le diviseur doit être strictement positif.");
  return {
    points: totals.points / divisor,
    rebounds: totals.rebounds / divisor,
    offensiveRebounds: totals.offensiveRebounds / divisor,
    defensiveRebounds: totals.defensiveRebounds / divisor,
    assists: totals.assists / divisor,
    steals: totals.steals / divisor,
    blocks: totals.blocks / divisor,
    turnovers: totals.turnovers / divisor,
    fouls: totals.fouls / divisor,
    twoPoints: divideShots(totals.twoPoints, divisor),
    threePoints: divideShots(totals.threePoints, divisor),
    freeThrows: divideShots(totals.freeThrows, divisor),
    fieldGoals: divideShots(totals.fieldGoals, divisor),
  };
}
