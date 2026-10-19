/**
 * Licence du segment d'URL : 1 à 8 caractères alphanumériques (`joueurs.licence` est un `string(8)`).
 * Tout le reste (`"create-examen"`, `"a b"`, `"%2F"`, 9 caractères) → `null` : page introuvable sans appel au back (P12, D8).
 */
export function parsePlayerLicence(raw: string): string | null {
  return /^[A-Za-z0-9]{1,8}$/.test(raw) ? raw : null;
}
