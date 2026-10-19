import "server-only";
import { redirectToSessionExpired } from "@/lib/redirectToSessionExpired";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { hasPermission } from "@/models/hasPermission";
import type { Session } from "@/models/Session";
import { getCurrentSession } from "@/repositories/SessionRepository";

export type AdminActionAccess = { ok: true; session: Session } | { ok: false; message: string };

/**
 * Garde d'une server action admin, à appeler en PREMIÈRE instruction (une action est un POST public). Session absente
 * → `/session/expired` (lève). Session sans `accessAdmin` → `{ ok: false }` : l'action renvoie un état d'erreur sans
 * lire ni écrire quoi que ce soit. Module sans `"use server"` : importé par les fichiers d'actions.
 */
export async function authorizeAdminAction(): Promise<AdminActionAccess> {
  const session = await getCurrentSession();
  if (!session) return redirectToSessionExpired();
  if (!hasPermission(session, "accessAdmin")) return { ok: false, message: ADMIN_MESSAGES.forbidden };
  return { ok: true, session };
}
