import type { Season } from "@/models/Season";

/** Saison du match parmi les saisons accessibles à l'utilisateur, sinon `null` (D2). */
export function findAccessibleSeason(seasons: readonly Season[], seasonId: number): Season | null {
  return seasons.find((season) => season.id === seasonId) ?? null;
}
