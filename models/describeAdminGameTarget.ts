import { formatDate } from "@/lib/format";
import type { Game } from "@/models/Game";

/** « le match de la journée 5, RPB U17 contre OTB, 12 janvier 2026 » : suffixe du nom accessible des actions de ligne. */
export function describeAdminGameTarget(game: Game): string {
  return `le match de la journée ${game.number}, ${game.home.name} contre ${game.away.name}, ${formatDate(game.date)}`;
}
