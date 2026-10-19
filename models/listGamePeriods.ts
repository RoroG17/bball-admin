import { REGULATION_PERIODS, type PeriodStats } from "@/models/PeriodStats";

/**
 * Périodes affichées : toujours Q1 à Q4, plus les prolongations présentes dans les lignes. Triées.
 * Typage structurel : lignes d'un match (fiche match) ou matchs d'un joueur (journal).
 */
export function listGamePeriods(lines: readonly { periods: readonly PeriodStats[] }[]): number[] {
  const periods = new Set(Array.from({ length: REGULATION_PERIODS }, (_, index) => index + 1));
  for (const line of lines) for (const stats of line.periods) periods.add(stats.period);
  return [...periods].sort((a, b) => a - b);
}
