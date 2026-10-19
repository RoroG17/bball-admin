import type { Player } from "@/models/Player";

/** Licence du faux joueur « adversaire » utilisé par la saisie pour les stats de l'équipe adverse. */
export const OPPONENT_PLACEHOLDER_LICENCE = "XXX";

/** Vrai pour le faux joueur « adversaire » : il n'est pas un joueur du club et ne doit apparaître dans aucun classement. */
export function isOpponentPlaceholder(player: Pick<Player, "licence">): boolean {
  return player.licence.trim().toUpperCase() === OPPONENT_PLACEHOLDER_LICENCE;
}
