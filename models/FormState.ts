export type FormValues<F extends string> = Readonly<Record<F, string>>;

export type FormErrorState<F extends string> = {
  status: "error";
  message: string | null;
  fieldErrors: Partial<Record<F, string>>;
  values: FormValues<F>;
};

export type FormState<F extends string> =
  | { status: "idle" }
  /** Action SANS redirection (ex. ajout d'un participant). */
  | { status: "success"; message: string }
  | FormErrorState<F>;

/** Page de confirmation : pas de champ. */
export type ConfirmFormState = FormState<never>;

export const IDLE_FORM_STATE: { status: "idle" } = { status: "idle" };

/** État d'erreur d'une action : message global et/ou erreurs de champ, saisie conservée. */
export function formError<F extends string>(
  values: FormValues<F>,
  message: string | null,
  fieldErrors: Partial<Record<F, string>> = {},
): FormErrorState<F> {
  return { status: "error", message, fieldErrors, values };
}
