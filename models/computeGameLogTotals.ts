import type { GameLogEntry } from "@/models/GameLogEntry";
import type { PeriodSelection } from "@/models/PeriodSelection";
import { selectPeriods } from "@/models/selectPeriods";
import type { StatTotals } from "@/models/StatTotals";
import { sumPeriodStats } from "@/models/sumPeriodStats";

/** Ligne « Total » du journal, sur la période choisie. */
export function computeGameLogTotals(log: readonly GameLogEntry[], selection: PeriodSelection): StatTotals {
  return sumPeriodStats(log.flatMap((entry) => selectPeriods(entry.periods, selection)));
}
