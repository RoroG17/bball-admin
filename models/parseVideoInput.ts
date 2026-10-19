import type { GameVideo } from "@/models/GameVideo";
import { parseGameVideo } from "@/models/parseGameVideo";
import { toVideoFieldValue } from "@/models/toVideoFieldValue";

/** Le back ignore un `video` nul ou vide (`?? ancienne valeur`) : le retrait est impossible tant que B-G3 n'est pas livré. */
export const GAME_VIDEO_REMOVAL_SUPPORTED = false;

export type VideoInputResult =
  | { kind: "set"; videoId: string }
  | { kind: "unchanged" }
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "removalUnsupported" };

/**
 * Interprète le champ vidéo. Valeur identique à la valeur courante = `unchanged` (permet de modifier le score d'un match
 * dont la vidéo hérite d'un texte invalide). Vide sur un match qui a une vidéo = retrait refusé (D-G5). Sinon
 * l'identifiant YouTube est extrait (jamais l'URL).
 */
export function parseVideoInput(raw: string, current: GameVideo): VideoInputResult {
  const value = raw.trim();
  if (value === "") {
    if (current.kind === "none") return { kind: "none" };
    return GAME_VIDEO_REMOVAL_SUPPORTED ? { kind: "none" } : { kind: "removalUnsupported" };
  }
  if (value === toVideoFieldValue(current)) return { kind: "unchanged" };
  const parsed = parseGameVideo(value);
  return parsed.kind === "youtube" ? { kind: "set", videoId: parsed.videoId } : { kind: "invalid" };
}
