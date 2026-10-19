import type { GameLogEntry } from "@/models/GameLogEntry";

/** Moyenne arrondie à la seconde des temps de jeu connus ; `null` si aucun (P8). */
export function averagePlayingTime(log: readonly GameLogEntry[]): number | null {
  const known = log.map((entry) => entry.playingTimeSeconds).filter((value) => value !== null);
  if (known.length === 0) return null;
  return Math.round(known.reduce((total, value) => total + value, 0) / known.length);
}
