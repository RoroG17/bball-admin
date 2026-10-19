/** Texte comparable : sans accents, en minuscules, espaces réduits. `"  Élodie  DURAND"` → `"elodie durand"`. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/\s+/g, " ")
    .trim();
}
