import type { GameStatus } from "@/models/GameStatus";
import type { StatsAvailability } from "@/models/StatsAvailability";

/** Des lignes saisies sont toujours affichées, même avant le score (saisie en direct). P6. */
export function getStatsAvailability(status: GameStatus, lineCount: number): StatsAvailability {
  if (lineCount > 0) return "available";
  return status === "upcoming" ? "upcoming" : "notEntered";
}
