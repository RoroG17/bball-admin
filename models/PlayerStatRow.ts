import type { Player } from "@/models/Player";
import type { StatTotals } from "@/models/StatTotals";

export type PlayerStatRow = {
  lineId: number;
  player: Player;
  playingTimeSeconds: number | null;
  /** Sur la période sélectionnée. */
  totals: StatTotals;
  /** « Ma ligne ». */
  isCurrentUser: boolean;
  /** Licence présente sur plusieurs lignes (P3). */
  isDuplicate: boolean;
};
