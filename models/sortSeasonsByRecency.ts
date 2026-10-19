import type { Season } from "@/models/Season";

/** Saisons de la plus récente à la plus ancienne (`startYear` puis `id`). Ne mute pas l'entrée. */
export function sortSeasonsByRecency(seasons: readonly Season[]): Season[] {
  return [...seasons].sort((a, b) => b.startYear - a.startYear || b.id - a.id);
}
