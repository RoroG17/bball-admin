const STOP_WORDS = new Set(["de", "du", "des", "la", "le", "les", "et", "d", "l"]);

function isAcronym(word: string): boolean {
  return word.length > 1 && /\p{L}/u.test(word) && word === word.toLocaleUpperCase("fr-FR");
}

/**
 * Initiales d'une équipe pour le logo de repli (3 lettres max).
 * `"Union Basket Vallon"` → `"UBV"`, `"FAC Basket"` → `"FAC"`, `"Toulouse"` → `"TOU"`.
 */
export function getTeamInitials(name: string): string {
  const words = name
    .split(/[\s\-'’]+/)
    .filter((word) => word !== "" && !STOP_WORDS.has(word.toLocaleLowerCase("fr-FR")));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 3).toLocaleUpperCase("fr-FR");

  return words
    .map((word) => (isAcronym(word) ? word : word.charAt(0)))
    .join("")
    .slice(0, 3)
    .toLocaleUpperCase("fr-FR");
}
