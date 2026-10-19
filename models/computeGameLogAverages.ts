import { computeGameLogTotals } from "@/models/computeGameLogTotals";
import { divideStatTotals } from "@/models/divideStatTotals";
import type { GameLogEntry } from "@/models/GameLogEntry";
import type { PeriodSelection } from "@/models/PeriodSelection";
import type { StatTotals } from "@/models/StatTotals";

/**
 * Moyenne PAR MATCH (un match en doublon compte une fois, avec toutes ses stats). `null` d'un compteur = 0, comme
 * la fiche match (Q8, D7). `null` si aucun match.
 */
export function computeGameLogAverages(log: readonly GameLogEntry[], selection: PeriodSelection): StatTotals | null {
  if (log.length === 0) return null;
  return divideStatTotals(computeGameLogTotals(log, selection), log.length);
}
