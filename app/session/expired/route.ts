import { NextResponse, type NextRequest } from "next/server";
import { ACTIVATION_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/sessionCookie";
import { buildLoginHref } from "@/models/buildLoginHref";

/**
 * Session refusée par le back (401) : le cookie ne peut pas être supprimé pendant le rendu d'une page, d'où ce Route
 * Handler. Supprime la session puis renvoie à la connexion avec « session expirée » et la page d'origine.
 * La suppression est posée sur la réponse elle-même : le `Set-Cookie` part à coup sûr avec la redirection.
 */
export function GET(request: NextRequest) {
  const loginHref = buildLoginHref({
    redirect: request.nextUrl.searchParams.get("redirect") ?? undefined,
    reason: "expired",
  });
  const response = NextResponse.redirect(new URL(loginHref, request.url), 303);
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(ACTIVATION_COOKIE_NAME);
  return response;
}
