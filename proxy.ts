import { NextResponse, type NextRequest } from "next/server";
import { REQUEST_PATH_HEADER } from "@/lib/requestPathHeader";
import { SESSION_COOKIE_NAME } from "@/lib/sessionCookie";
import { buildLoginHref } from "@/models/buildLoginHref";

/**
 * Vérification optimiste : seule la présence du cookie est contrôlée ici (redirection rapide, pas une frontière de
 * sécurité). La signature et les droits sont vérifiés dans chaque vue et chaque action (`SessionRepository`).
 */
export function proxy(request: NextRequest) {
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL(buildLoginHref({ redirect: requestedPath }), request.url));
  }

  // Chemin demandé, relu par `readRequestPath()` pour revenir à la page après une reconnexion.
  const headers = new Headers(request.headers);
  headers.set(REQUEST_PATH_HEADER, requestedPath);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!privacy(?:/|$)|suppress-data(?:/|$)|login|init-password|session/expired|api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
