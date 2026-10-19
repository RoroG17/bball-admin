import type { AdminGameRow } from "@/models/AdminGameRow";
import type { Game } from "@/models/Game";
import type { RpbTeam } from "@/models/RpbTeam";
import { toCalendarGame } from "@/models/toCalendarGame";

/** Un match non joué n'est jamais « à saisir » ; `awaitingIds` nul = indicateur indéterminé. */
export function toAdminGameRow(
  game: Game,
  rpbTeam: RpbTeam | null,
  today: string,
  awaitingIds: ReadonlySet<number> | null,
): AdminGameRow {
  const entry = toCalendarGame(game, rpbTeam, today);
  return { entry, awaitingStats: awaitingIds === null ? null : entry.status === "played" && awaitingIds.has(game.id) };
}
