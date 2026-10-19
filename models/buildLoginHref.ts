import type { LoginReason } from "@/models/LoginReason";
import { sanitizeRedirectPath } from "@/models/sanitizeRedirectPath";

/** Seul constructeur de l'URL de connexion. `redirect` assaini et omis s'il vaut `/` (URL canonique `/login`). */
export function buildLoginHref(options: { redirect?: string; reason?: LoginReason } = {}): string {
  const params = new URLSearchParams();
  if (options.reason) params.set("reason", options.reason);
  const redirect = sanitizeRedirectPath(options.redirect);
  if (redirect !== "/") params.set("redirect", redirect);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
