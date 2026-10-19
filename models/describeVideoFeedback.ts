import { GAME_MESSAGES } from "@/models/adminGameMessages";
import type { GameVideo } from "@/models/GameVideo";
import { parseVideoInput } from "@/models/parseVideoInput";

export type VideoFeedback = { tone: "ok" | "warning" | "error"; text: string; videoId: string | null };

/** Retour en direct sous le champ vidéo (mêmes textes que les erreurs de l'action). `null` : rien à dire. */
export function describeVideoFeedback(raw: string, current: GameVideo): VideoFeedback | null {
  const result = parseVideoInput(raw, current);
  switch (result.kind) {
    case "none":
      return null;
    case "set":
      return { tone: "ok", text: GAME_MESSAGES.videoRecognized(result.videoId), videoId: result.videoId };
    case "unchanged":
      if (current.kind === "invalid") return { tone: "warning", text: GAME_MESSAGES.videoLegacyInvalid, videoId: null };
      if (current.kind === "youtube") {
        return { tone: "ok", text: GAME_MESSAGES.videoRecognized(current.videoId), videoId: current.videoId };
      }
      return null;
    case "invalid":
      return { tone: "error", text: GAME_MESSAGES.videoInvalid, videoId: null };
    case "removalUnsupported":
      return { tone: "error", text: GAME_MESSAGES.videoRemovalUnsupported, videoId: null };
  }
}
