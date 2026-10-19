import type { Account, AccountProtection } from "@/models/Account";
import type { Session } from "@/models/Session";

/**
 * Pourquoi un compte ne peut être ni réinitialisé ni supprimé : c'est le compte connecté (`self`, égalité stricte) ou un
 * compte de rôle `admin` (`admin`). Sous D1 il n'existe qu'un administrateur : aucun compte `admin` n'est touchable.
 * Un compte ambigu (`Admin `, rôle joueur) n'est pas protégé : il doit pouvoir être supprimé.
 */
export function getAccountProtection(
  account: Pick<Account, "username" | "role">,
  session: Pick<Session, "username">,
): AccountProtection | null {
  if (account.username === session.username) return "self";
  return account.role === "admin" ? "admin" : null;
}
