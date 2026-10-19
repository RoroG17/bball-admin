const MAX_LENGTH = 2048;
const BASE = "http://sanitize.invalid";
const AUTH_PATHS = ["/login", "/init-password", "/session/expired"];

/**
 * Chemin interne sûr pour une redirection après connexion (P8), sinon `fallback`.
 * Refuse : non-chaîne, vide ou trop long, caractères de contrôle ou espaces (le parseur d'URL les retire :
 * `"/\t/evil.com"` deviendrait `//evil.com`), `//…`, toute barre oblique inverse, autre origine, pages
 * d'authentification (évite les boucles). Sortie : `pathname + search`, sans fragment ni paramètre interne `_rsc`.
 */
export function sanitizeRedirectPath(raw: string | string[] | null | undefined, fallback = "/"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_LENGTH) return fallback;
  if (/[\u0000- \u007f]/.test(raw)) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;

  const isAuthPath = AUTH_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
  if (isAuthPath) return fallback;

  url.searchParams.delete("_rsc");
  return `${url.pathname}${url.search}`;
}
