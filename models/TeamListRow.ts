import type { Season } from "@/models/Season";
import type { Team } from "@/models/Team";

export type TeamListRow = {
  team: Team;
  /** `null` = saisons illisibles (indicateur indisponible). */
  clubSeasons: readonly Season[] | null;
  /** `null` = joueurs illisibles. */
  playerCount: number | null;
};
