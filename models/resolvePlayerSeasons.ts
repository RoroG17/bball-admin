import type { Season } from "@/models/Season";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";

/**
 * Saisons de la fiche : participations ∪ saisons où le joueur a des stats (Q5, D5), dédoublonnées ; ids inconnus ignorés ;
 * limitées aux saisons du lecteur quand `viewerSeasonIds` est une liste (Q3). De la plus récente à la plus ancienne.
 */
export function resolvePlayerSeasons(input: {
  allSeasons: readonly Season[];
  participationSeasonIds: readonly number[];
  statSeasonIds: readonly number[];
  viewerSeasonIds: readonly number[] | "all";
}): Season[] {
  const { allSeasons, participationSeasonIds, statSeasonIds, viewerSeasonIds } = input;
  const ids = new Set([...participationSeasonIds, ...statSeasonIds]);
  const visible = viewerSeasonIds === "all" ? null : new Set(viewerSeasonIds);
  const seen = new Set<number>();
  return sortSeasonsByRecency(
    allSeasons.filter((season) => {
      if (seen.has(season.id) || !ids.has(season.id) || (visible !== null && !visible.has(season.id))) return false;
      seen.add(season.id);
      return true;
    }),
  );
}
