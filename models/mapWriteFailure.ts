import { ADMIN_MESSAGES, BACK_KIND_MESSAGES } from "@/models/adminMessages";
import { classifyBackMessage, type BackMessageKind } from "@/models/classifyBackMessage";
import { formError, type FormErrorState, type FormValues } from "@/models/FormState";
import type { WriteFailure } from "@/models/WriteFailure";

export type MapWriteFailureOptions<F extends string> = {
  /** Champ du back → champ du formulaire. */
  fieldMap: Readonly<Record<string, F>>;
  /** Texte propre au champ, prioritaire sur `BACK_KIND_MESSAGES`. */
  fieldMessages?: Partial<Record<F, Partial<Record<BackMessageKind, string>>>>;
  notFoundMessage?: string;
};

/** Convertit un échec d'écriture en état de formulaire français. La phrase du back n'est jamais copiée. */
export function mapWriteFailure<F extends string>(
  failure: WriteFailure,
  values: FormValues<F>,
  options: MapWriteFailureOptions<F>,
): FormErrorState<F> {
  switch (failure.kind) {
    case "invalid": {
      const fieldErrors: Partial<Record<F, string>> = {};
      let unmapped = false;
      for (const [backField, messages] of Object.entries(failure.errors)) {
        const field = Object.hasOwn(options.fieldMap, backField) ? options.fieldMap[backField] : undefined;
        if (field === undefined) {
          unmapped = true;
          continue;
        }
        const kind = classifyBackMessage(messages[0] ?? "");
        fieldErrors[field] ??= options.fieldMessages?.[field]?.[kind] ?? BACK_KIND_MESSAGES[kind];
      }
      const hasFieldErrors = Object.keys(fieldErrors).length > 0;
      const message =
        unmapped || !hasFieldErrors ? ADMIN_MESSAGES.rejected : ADMIN_MESSAGES.fixFields;
      return formError(values, message, fieldErrors);
    }
    case "notFound":
      return formError(values, options.notFoundMessage ?? ADMIN_MESSAGES.gone);
    case "forbidden":
      return formError(values, ADMIN_MESSAGES.forbidden);
    case "conflict":
      return formError(values, ADMIN_MESSAGES.conflict);
    case "failed":
      return formError(values, failure.reason === "network" ? ADMIN_MESSAGES.networkWrite : ADMIN_MESSAGES.serverWrite);
  }
}
