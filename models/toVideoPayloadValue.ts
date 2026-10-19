import type { GameVideo } from "@/models/GameVideo";
import type { VideoInputResult } from "@/models/parseVideoInput";
import { toVideoFieldValue } from "@/models/toVideoFieldValue";

/** Valeur envoyée au back. `invalid` et `removalUnsupported` n'arrivent jamais ici : l'action les a transformés en erreur. */
export function toVideoPayloadValue(result: VideoInputResult, current: GameVideo): string | null {
  switch (result.kind) {
    case "set":
      return result.videoId;
    case "unchanged":
      return toVideoFieldValue(current) || null;
    default:
      return null;
  }
}
