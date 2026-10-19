import type { FormValues } from "@/models/FormState";
import type { GameFormField } from "@/models/GameFormField";
import { GAME_WARNING_ACK_FIELD, type GameWarning } from "@/models/GameWarning";

/** Avertissements dont la case « Je confirme » n'est pas cochée (`"on"`). */
export function filterUnacknowledgedWarnings(
  warnings: readonly GameWarning[],
  values: FormValues<GameFormField>,
): GameWarning[] {
  return warnings.filter((warning) => values[GAME_WARNING_ACK_FIELD[warning.kind]] !== "on");
}
