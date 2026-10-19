import { isReservedUsername } from "@/models/isReservedUsername";
import { USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "@/models/AccountRules";

export type UsernameIssue = "required" | "tooLong" | "badCharacters" | "reserved";

/**
 * Contrôles d'un identifiant à la création, dans l'ordre : vide, trop long (en points de code), caractères hors
 * `[\p{L}\p{N}._-]` (tout espace est refusé), identifiant réservé. Rien n'est nettoyé en silence (D-ADM-3).
 */
export function validateUsername(value: string): UsernameIssue | null {
  if (value === "") return "required";
  if ([...value].length > USERNAME_MAX_LENGTH) return "tooLong";
  if (!USERNAME_PATTERN.test(value)) return "badCharacters";
  if (isReservedUsername(value)) return "reserved";
  return null;
}
