import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import type { Season } from "@/models/Season";

const MAX_LISTED = 3;

/** « Équipe du club pour : A ; B ; C et 2 autres », ou `null` si aucune saison n'utilise l'équipe. */
export function describeTeamClubRole(seasons: readonly Season[]): string | null {
  if (seasons.length === 0) return null;
  const labels = seasons.slice(0, MAX_LISTED).map(formatSeasonLabel).join(" ; ");
  const rest = seasons.length - MAX_LISTED;
  return `Équipe du club pour : ${labels}${rest > 0 ? ` et ${rest} ${rest === 1 ? "autre" : "autres"}` : ""}`;
}
