import type { Player } from "@/models/Player";

export type HallOfFameEntry = {
  /** Rang « compétition » calculé sur la valeur affichée : les ex æquo partagent le même rang. */
  rank: number;
  player: Player;
  /** Volume (points, passes…) ou pourcentage (0–100), tel que fourni par le back. */
  value: number;
};
