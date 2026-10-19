import { formatDate } from "@/lib/format";
import type { Game } from "@/models/Game";

/** « Journée 5 · RPB U17 contre OTB · 12 janvier 2026 » : titre de la page de suppression. */
export function formatAdminGameTitle(game: Game): string {
  return `Journée ${game.number} · ${game.home.name} contre ${game.away.name} · ${formatDate(game.date)}`;
}
