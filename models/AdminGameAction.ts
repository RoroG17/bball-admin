export type AdminGameAction = "enterStats" | "editGame" | "addVideo";

export const ADMIN_GAME_ACTION_LABELS: Record<AdminGameAction, string> = {
  enterStats: "Saisir les stats",
  editGame: "Modifier le match",
  addVideo: "Ajouter la vidéo",
};
