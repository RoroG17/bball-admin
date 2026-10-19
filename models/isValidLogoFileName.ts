const LOGO_FILE_NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._()-]*$/u;

/**
 * Nom de fichier simple : 1 à 255 caractères, lettres, chiffres, espace, point, tiret, tiret bas et parenthèses,
 * jamais de `..`. Refuse `/`, `\`, `:` (donc les adresses), `?`, `#`, `%` et un nom qui commence par un point. Ne teste
 * pas l'extension : un logo historique d'un autre format doit rester éditable (D-T5).
 */
export function isValidLogoFileName(value: string): boolean {
  return value.length >= 1 && value.length <= 255 && !value.includes("..") && LOGO_FILE_NAME.test(value);
}
