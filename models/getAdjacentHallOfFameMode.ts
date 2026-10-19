import { HALL_OF_FAME_MODES, type HallOfFameMode } from "@/models/HallOfFameMode";

export type HallOfFameModeMove = "next" | "previous" | "first" | "last";

/** Navigation clavier entre les onglets : circulaire pour `next` et `previous`. */
export function getAdjacentHallOfFameMode(current: HallOfFameMode, move: HallOfFameModeMove): HallOfFameMode {
  const count = HALL_OF_FAME_MODES.length;
  if (move === "first") return HALL_OF_FAME_MODES[0];
  if (move === "last") return HALL_OF_FAME_MODES[count - 1];
  const index = HALL_OF_FAME_MODES.indexOf(current);
  return HALL_OF_FAME_MODES[(index + (move === "next" ? 1 : count - 1)) % count];
}
