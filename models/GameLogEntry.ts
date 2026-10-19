import type { CalendarGame } from "@/models/CalendarGame";
import type { PeriodStats } from "@/models/PeriodStats";

/** Un match du joueur ; les lignes en double d'un même match sont fusionnées. */
export type GameLogEntry = {
  gameId: number;
  seasonId: number;
  gameLabel: string;
  /** `null` si le match est absent de `GET /api/matchs` (ne devrait pas arriver : clé étrangère). */
  overview: CalendarGame | null;
  /** Plus de 1 : doublon (badge « Doublon »). */
  lineCount: number;
  playingTimeSeconds: number | null;
  /** Périodes de toutes les lignes du match, concaténées (les sommes restent justes). */
  periods: PeriodStats[];
};
