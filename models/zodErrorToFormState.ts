import type { z } from "zod";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { formError, type FormErrorState, type FormValues } from "@/models/FormState";

/**
 * Première erreur de chaque champ connu ; les issues sans champ connu deviennent le message global (la première).
 * Des erreurs de champ sans message global donnent « Corrige les champs signalés ».
 */
export function zodErrorToFormState<F extends string>(
  error: z.ZodError,
  fields: readonly F[],
  values: FormValues<F>,
): FormErrorState<F> {
  const fieldErrors: Partial<Record<F, string>> = {};
  let message: string | null = null;
  for (const issue of error.issues) {
    const key = issue.path[0];
    const field = typeof key === "string" ? fields.find((candidate) => candidate === key) : undefined;
    if (field === undefined) message ??= issue.message;
    else fieldErrors[field] ??= issue.message;
  }
  if (message === null && Object.keys(fieldErrors).length > 0) message = ADMIN_MESSAGES.fixFields;
  return formError(values, message, fieldErrors);
}
