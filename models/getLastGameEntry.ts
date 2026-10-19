import type { GameLogEntry } from "@/models/GameLogEntry";

/**
 * Dernier match AVEC stats du journal trié (des stats saisies = match joué), quel que soit son statut ; à défaut d'un
 * match connu, la dernière entrée. Jamais un match sans stats (P5, D10). `null` si le journal est vide.
 */
export function getLastGameEntry(log: readonly GameLogEntry[]): GameLogEntry | null {
  const known = log.filter((entry) => entry.overview !== null);
  return known.at(-1) ?? log.at(-1) ?? null;
}
