import { computeGameLogAverages } from "@/models/computeGameLogAverages";
import type { GameLogEntry } from "@/models/GameLogEntry";
import type { StatTotals } from "@/models/StatTotals";

export type PeriodAverages = { period: number; averages: StatTotals };

/** Moyenne par match de chaque période. Journal vide : `[]`. */
export function computeGameLogPeriodAverages(log: readonly GameLogEntry[], periods: readonly number[]): PeriodAverages[] {
  if (log.length === 0) return [];
  return periods.map((period) => ({ period, averages: computeGameLogAverages(log, period)! }));
}
