/** Civilités acceptées à l'écriture (valeurs du back, D-P6) ; toute autre valeur est refusée. */
export const CIVILITIES = ["M", "F"] as const;
export type Civility = (typeof CIVILITIES)[number];

export const CIVILITY_LABELS: Record<Civility, string> = { M: "Masculin", F: "Féminin" };

export const CIVILITY_OPTIONS: readonly { value: Civility; label: string }[] = CIVILITIES.map((value) => ({
  value,
  label: CIVILITY_LABELS[value],
}));
