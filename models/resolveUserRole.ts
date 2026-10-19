import type { AuthenticatedUser } from "@/models/AuthenticatedUser";
import type { UserRole } from "@/models/Session";

export const ADMIN_USERNAME = "admin";

/**
 * Le back n'expose pas de rôle (B3). Règle fermée par défaut (D1) : seul le compte `admin`, sans licence, est
 * administrateur. Tout autre compte est joueur, y compris un compte sans licence (« compte sans joueur »).
 * Comparaison stricte, sans `trim` ni changement de casse : sous PostgreSQL, un compte créé sous `"Admin "` ou `"ADMIN"`
 * (la création de compte est publique côté back) ne doit jamais devenir administrateur.
 * Isolée ici pour être remplacée le jour où le back exposera un vrai rôle.
 */
export function resolveUserRole(user: Pick<AuthenticatedUser, "username" | "licence">): UserRole {
  return user.licence === null && user.username === ADMIN_USERNAME ? "admin" : "player";
}
