/**
 * Point de décodage UNIQUE d'un identifiant venu d'une URL (`[id]`) ou d'un champ caché. Un seul `decodeURIComponent`
 * si le texte contient `%` (échec : texte brut). Vide, plus de 255 caractères ou caractère de contrôle : `null`.
 * Ne vérifie pas le charset de création : les comptes historiques ont des espaces et des accents.
 */
export function parseAccountUsername(raw: string): string | null {
  let value = raw;
  if (raw.includes("%")) {
    try {
      value = decodeURIComponent(raw);
    } catch {
      value = raw;
    }
  }
  if (value === "" || value.length > 255 || /\p{Cc}/u.test(value)) return null;
  return value;
}
