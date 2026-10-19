import type { StatTotals } from "@/models/StatTotals";
import type { TeamStat } from "@/models/TeamStat";

export function getTeamStatValue(totals: StatTotals, stat: TeamStat): number {
  return totals[stat];
}
