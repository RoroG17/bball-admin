import "server-only";
import { revalidateTargets } from "@/actions/support/revalidateTargets";
import { SEASON_PARTICIPANT_REVALIDATION } from "@/models/adminRevalidation";

/**
 * Rafraîchit les pages qui affichent les participants d'une saison (C7 : un seul mécanisme, utilisé par l'inscription
 * d'un joueur et par les actions de participants). Palmarès non concerné. À appeler seulement après une écriture réelle.
 */
export function refreshAfterSeasonParticipantChange(): void {
  revalidateTargets(SEASON_PARTICIPANT_REVALIDATION);
}
