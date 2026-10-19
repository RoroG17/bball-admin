import type { AdminGameAction } from "@/models/AdminGameAction";
import type { GameVideo } from "@/models/GameVideo";

/**
 * Actions admin, dans l'ordre d'affichage. « Saisir les stats » seulement s'il n'existe aucune ligne
 * (ni si le nombre est inconnu, D4) ; « Ajouter la vidéo » si aucune vidéo valide.
 */
export function getAdminGameActions({
  statLineCount,
  video,
}: {
  statLineCount: number | null;
  video: GameVideo;
}): AdminGameAction[] {
  const actions: AdminGameAction[] = [];
  if (statLineCount === 0) actions.push("enterStats");
  actions.push("editGame");
  if (video.kind !== "youtube") actions.push("addVideo");
  return actions;
}
