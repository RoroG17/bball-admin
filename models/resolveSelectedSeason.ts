import type { Season } from "@/models/Season";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";

/**
 * Saison à afficher : celle demandée si elle est accessible, sinon la plus récente.
 * `null` si aucune saison n'est accessible.
 */
export function resolveSelectedSeason(accessible: readonly Season[], requested: string | undefined): Season | null {
  if (requested !== undefined && /^\d+$/.test(requested)) {
    const requestedId = Number(requested);
    const match = accessible.find((season) => season.id === requestedId);
    if (match) return match;
  }
  return sortSeasonsByRecency(accessible)[0] ?? null;
}
