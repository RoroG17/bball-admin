import type { GameLogEntry } from "@/models/GameLogEntry";
import type { PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";

export function filterGameLog(log: readonly GameLogEntry[], selection: PlayerSeasonSelection): GameLogEntry[] {
  return selection.kind === "career" ? [...log] : log.filter((entry) => entry.seasonId === selection.season.id);
}
