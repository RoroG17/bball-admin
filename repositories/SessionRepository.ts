import "server-only";
import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { env } from "@/lib/env";
import { readRequestPath } from "@/lib/readRequestPath";
import {
  ACTIVATION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  buildCookieOptions,
} from "@/lib/sessionCookie";
import { signSessionToken, verifySessionToken } from "@/lib/sessionToken";
import type { AuthenticatedUser } from "@/models/AuthenticatedUser";
import { buildLoginHref } from "@/models/buildLoginHref";
import { hasPermission } from "@/models/hasPermission";
import type { Permission } from "@/models/Permission";
import { resolveUserRole } from "@/models/resolveUserRole";
import { SessionSchema, type Session } from "@/models/Session";

/** Session de l'utilisateur courant, lue dans le cookie signé. `null` si absent, falsifié ou expiré. */
export const getCurrentSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const payload = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value, env.SESSION_SECRET);
  if (!payload) return null;
  return SessionSchema.parse({ ...payload, role: resolveUserRole(payload) });
});

/**
 * Écrit le cookie de session (écrase tout cookie précédent : pas de fixation de session).
 * Server Action ou Route Handler uniquement.
 */
export async function createSession(user: AuthenticatedUser, token: string): Promise<void> {
  const value = await signSessionToken({ username: user.username, licence: user.licence, token }, env.SESSION_SECRET);
  (await cookies()).set(SESSION_COOKIE_NAME, value, buildCookieOptions(SESSION_MAX_AGE_SECONDS));
}

/** Supprime la session et toute activation en cours : aucune identité résiduelle (P5). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ACTIVATION_COOKIE_NAME);
}

/**
 * Garde des vues de page. Sans session valide : retour à la connexion avec la page demandée, et le message
 * « session expirée » si un cookie était présent mais n'est plus valide.
 */
export async function requireSession(): Promise<Session> {
  const session = await getCurrentSession();
  if (session) return session;
  const hadCookie = (await cookies()).has(SESSION_COOKIE_NAME);
  redirect(buildLoginHref({ redirect: await readRequestPath(), reason: hadCookie ? "expired" : undefined }));
}

/** Garde des vues de page réservées : « Accès refusé » explicite (P3, D6). Les actions utilisent `hasPermission`. */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session, permission)) forbidden();
  return session;
}

/**
 * Garde de la zone admin (D-ADM-2) : PREMIÈRE instruction de toute vue admin racine, avant tout appel de données.
 * Jamais dans un layout (il ne se re-rend pas à la navigation). Les actions utilisent `authorizeAdminAction`.
 */
export async function requireAdmin(): Promise<Session> {
  return requirePermission("accessAdmin");
}
