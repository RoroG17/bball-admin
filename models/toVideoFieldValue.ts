import type { GameVideo } from "@/models/GameVideo";

/** Valeur du champ vidéo pré-rempli : l'identifiant, le texte invalide tel quel, ou rien. */
export function toVideoFieldValue(video: GameVideo): string {
  switch (video.kind) {
    case "youtube":
      return video.videoId;
    case "invalid":
      return video.raw;
    case "none":
      return "";
  }
}
