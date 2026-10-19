/** Classes d'un champ de saisie (48 px, bordure encre, bordure danger si invalide), communes aux champs de formulaire. */
export const FIELD_CONTROL_CLASSES =
  "min-h-12 w-full min-w-0 appearance-none rounded-lg border-2 border-rpb-ink bg-rpb-cream px-3.5 text-base font-medium tabular-nums text-rpb-ink focus-ring aria-invalid:border-danger";

/** Ids `aria-describedby` d'un champ : aide, erreur et ids supplémentaires (ex. règle de mot de passe). */
export function describedByIds(...ids: (string | false | null | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined || undefined;
}
