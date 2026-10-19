import { DEFAULT_HALL_OF_FAME_MODE, HALL_OF_FAME_MODE_PARAMS, type HallOfFameMode } from "@/models/HallOfFameMode";

/** Valeur canonique de `?mode=`, ou `null` pour le mode par défaut (URL sans paramètre). */
export function formatHallOfFameModeParam(mode: HallOfFameMode): string | null {
  return mode === DEFAULT_HALL_OF_FAME_MODE ? null : HALL_OF_FAME_MODE_PARAMS[mode];
}
