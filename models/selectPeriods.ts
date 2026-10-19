import type { PeriodSelection } from "@/models/PeriodSelection";
import type { PeriodStats } from "@/models/PeriodStats";

export function selectPeriods(periods: readonly PeriodStats[], selection: PeriodSelection): PeriodStats[] {
  return selection === "all" ? [...periods] : periods.filter((stats) => stats.period === selection);
}
