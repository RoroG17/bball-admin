import type { Season } from "@/models/Season";

export type TeamUsage = {
  clubSeasons: readonly Season[];
  playerCount: number;
  /** `null` = non calculable (nom d'équipe non unique). */
  gameCount: number | null;
};
