const REPLACEMENT = "�";
// C0 (hors \t et \n), DEL et C1, marques bidirectionnelles (usurpation d'affichage).
const FORBIDDEN = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F؜‎‏‪-‮⁦-⁩]/g;

/**
 * Texte d'un tiers → texte affichable : remplace par « � » les caractères de contrôle et les marques bidirectionnelles.
 * Sans `multiline`, `\n` et `\t` deviennent une espace. N'échappe PAS le HTML : React le fait, et le texte n'est
 * jamais injecté en HTML.
 */
export function sanitizeUntrustedText(text: string, options: { multiline?: boolean } = {}): string {
  const normalized = text.replace(/\r\n/g, "\n");
  const flattened = options.multiline ? normalized : normalized.replace(/[\n\t]/g, " ");
  return flattened.replace(FORBIDDEN, REPLACEMENT);
}
