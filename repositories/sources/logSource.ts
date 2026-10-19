import "server-only";
import { forbidden } from "next/navigation";
import { cache } from "react";
import { apiGet } from "@/lib/http";
import type { LogKind } from "@/models/LogKind";
import { hasPermission } from "@/models/hasPermission";
import { getCurrentSession } from "@/repositories/SessionRepository";

/**
 * `GET /api/logs/<kind>?<search>`, UNE fois par (type, recherche) et par rendu : la table et le panneau de détail
 * partagent la lecture. Lecture VIVANTE et jamais mise en cache (`no-store` par défaut de `apiGet`, ni `revalidate` ni
 * tags : données personnelles). Le corps n'est JAMAIS journalisé. Renvoie le JSON brut : le repository valide.
 *
 * Défense en profondeur : la vue a déjà appelé `requireAdmin()`, mais un futur appelant qui l'oublierait ne lit rien.
 */
export const fetchLogPayload = cache(async (kind: LogKind, search: string): Promise<unknown> => {
  const session = await getCurrentSession();
  if (!session) throw new Error("Session absente");
  if (!hasPermission(session, "accessAdmin")) forbidden();
  return apiGet(`/api/logs/${kind}?${search}`, { token: session.token });
});
