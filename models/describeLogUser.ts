import type { LogUser } from "@/models/LogUser";
import { sanitizeUntrustedText } from "@/models/sanitizeUntrustedText";

/** Nom assaini, ou « Anonyme » (aussi un compte supprimé : `nullOnDelete`). */
export function describeLogUser(user: LogUser | null): string {
  return user === null ? "Anonyme" : sanitizeUntrustedText(user.username);
}
