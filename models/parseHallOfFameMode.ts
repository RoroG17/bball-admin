import {
  DEFAULT_HALL_OF_FAME_MODE,
  HALL_OF_FAME_MODES,
  HALL_OF_FAME_MODE_PARAMS,
  type HallOfFameMode,
} from "@/models/HallOfFameMode";

/** Mode correspondant au paramètre `?mode=` (casse exacte). Absent, vide ou inconnu → mode par défaut. */
export function parseHallOfFameMode(param: string | null | undefined): HallOfFameMode {
  return HALL_OF_FAME_MODES.find((mode) => HALL_OF_FAME_MODE_PARAMS[mode] === param) ?? DEFAULT_HALL_OF_FAME_MODE;
}
