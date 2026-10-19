import { isOpponentPlaceholder } from "@/models/isOpponentPlaceholder";
import type { ShotSide } from "@/models/ShotFilter";

/** Vrai si la licence appartient à l'équipe demandée : l'adversaire est le faux joueur, tous les autres sont mon équipe. */
export function matchesShotSide(licence: string, side: ShotSide): boolean {
  return isOpponentPlaceholder({ licence }) === (side === "opponent");
}
