import { RESERVED_USERNAMES } from "@/models/AccountRules";

/**
 * Forme comparable : NFKC, retrait des marques et des caractères de contrôle ou de largeur nulle, minuscules, `trim`.
 * Vrai si elle vaut un identifiant réservé (`Admin`, `admin `, `ádmin`, `ａｄｍｉｎ`, `ad` + espace de largeur nulle + `min`).
 * Les homoglyphes d'autres alphabets (`аdmin` cyrillique) ne sont pas couverts : sans conséquence, le rôle exige
 * l'égalité stricte.
 */
export function isReservedUsername(value: string): boolean {
  const comparable = value
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\p{M}\p{C}]/gu, "")
    .toLocaleLowerCase("en-US")
    .trim();
  return RESERVED_USERNAMES.includes(comparable);
}
