/** Noms et attributs des cookies d'authentification. Fichier sans dépendance, pour rester léger dans `proxy.ts`. */
export const SESSION_COOKIE_NAME = "bball_session";

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Compte sans mot de passe en cours d'activation (D2) : l'identifiant ne passe jamais par l'URL. */
export const ACTIVATION_COOKIE_NAME = "bball_activation";

export const ACTIVATION_MAX_AGE_SECONDS = 15 * 60;

/** `HttpOnly` : aucun script de la page ne lit le jeton. `Secure` en production uniquement (D12, HTTPS obligatoire). */
export function buildCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
