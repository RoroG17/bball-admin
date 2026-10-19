import type { SeasonRecord } from "@/models/SeasonRecord";

/** Taux de victoire entre 0 et 1, `null` si aucun match n'a été gagné ni perdu. */
export function computeWinRate({ wins, losses }: SeasonRecord): number | null {
  const played = wins + losses;
  return played === 0 ? null : wins / played;
}
