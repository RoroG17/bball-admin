import type { FieldGoalAttempt } from "@/models/FieldGoalAttempt";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import { sumPeriodStats } from "@/models/sumPeriodStats";

/** Une entrée par ligne et par période : tirs à 2 et 3 points tentés (lancers francs exclus, D10). */
export function buildFieldGoalAttempts(lines: readonly PlayerGameStats[]): FieldGoalAttempt[] {
  return lines.flatMap((line) =>
    line.periods.map((stats) => ({
      playerLicence: line.player.licence,
      period: stats.period,
      attempted: sumPeriodStats([stats]).fieldGoals.attempted,
    })),
  );
}
