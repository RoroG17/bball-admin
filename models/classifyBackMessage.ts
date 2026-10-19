export type BackMessageKind = "taken" | "required" | "tooLong" | "unknownReference" | "invalid";

/** Règles ordonnées sur les phrases par défaut (anglaises) de Laravel : une règle de plus = une ligne. */
const RULES: readonly { kind: BackMessageKind; matches: (message: string) => boolean }[] = [
  { kind: "taken", matches: (m) => /has already been taken/.test(m) },
  { kind: "required", matches: (m) => /(field )?is required|must be present/.test(m) },
  { kind: "tooLong", matches: (m) => /characters/.test(m) && /greater than|may not be|must not be/.test(m) },
  { kind: "unknownReference", matches: (m) => /selected .+ is invalid|does not exist/.test(m) },
];

/** Classe une phrase de validation du back (insensible à la casse) ; inconnue → `invalid`. Jamais affichée telle quelle. */
export function classifyBackMessage(message: string): BackMessageKind {
  const normalized = message.toLowerCase();
  return RULES.find((rule) => rule.matches(normalized))?.kind ?? "invalid";
}
