import { computeTeamTotals } from "@/models/computeTeamTotals";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import type { StatTotals } from "@/models/StatTotals";

export type TeamPeriodTotals = { period: number; totals: StatTotals };

/** Totaux de l'équipe pour chaque période demandée (période sans donnée → zéros). */
export function computeTeamPeriodTotals(
  lines: readonly PlayerGameStats[],
  periods: readonly number[],
): TeamPeriodTotals[] {
  return periods.map((period) => ({ period, totals: computeTeamTotals(lines, period) }));
}
