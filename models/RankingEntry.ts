import type { Player } from "@/models/Player";

export type RankingEntry = {
  /** Rang « compétition » : les ex æquo partagent le même rang. */
  rank: number;
  player: Player;
  /** Moyenne par match, ou % moyen par match (0–100). */
  value: number;
  /** Cumul de la saison, ou nombre de tirs réussis pour les %. */
  total: number | null;
};
