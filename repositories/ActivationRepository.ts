import "server-only";
import { cookies } from "next/headers";
import { signActivationToken, verifyActivationToken } from "@/lib/activationToken";
import { env } from "@/lib/env";
import { ACTIVATION_COOKIE_NAME, ACTIVATION_MAX_AGE_SECONDS, buildCookieOptions } from "@/lib/sessionCookie";

/**
 * Compte sans mot de passe en cours d'activation (D2). L'identifiant vit dans un cookie signé de 15 minutes, posé
 * par la connexion : l'écran de création du mot de passe ne lit jamais l'identifiant dans l'URL ni dans le formulaire.
 */
export async function startActivation(username: string): Promise<void> {
  const value = await signActivationToken(username, env.SESSION_SECRET);
  (await cookies()).set(ACTIVATION_COOKIE_NAME, value, buildCookieOptions(ACTIVATION_MAX_AGE_SECONDS));
}

/** `null` si absent, falsifié, expiré ou d'un autre usage. */
export async function getPendingActivation(): Promise<{ username: string } | null> {
  return verifyActivationToken((await cookies()).get(ACTIVATION_COOKIE_NAME)?.value, env.SESSION_SECRET);
}

export async function endActivation(): Promise<void> {
  (await cookies()).delete(ACTIVATION_COOKIE_NAME);
}
