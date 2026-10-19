import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { describeGameWarning } from "@/models/describeGameWarning";
import { formError, type FormErrorState, type FormValues } from "@/models/FormState";
import type { GameFormField } from "@/models/GameFormField";
import { GAME_WARNING_ACK_FIELD, type GameWarning } from "@/models/GameWarning";

/** État d'erreur « avertissements à acquitter » : une erreur par case `ack…`, saisie conservée. Rien n'a été écrit. */
export function toWarningState(
  values: FormValues<GameFormField>,
  warnings: readonly GameWarning[],
): FormErrorState<GameFormField> {
  const fieldErrors: Partial<Record<GameFormField, string>> = {};
  for (const warning of warnings) fieldErrors[GAME_WARNING_ACK_FIELD[warning.kind]] = describeGameWarning(warning);
  return formError(values, GAME_MESSAGES.warningsIntro, fieldErrors);
}
