import { sanitizeRedirectPath } from "@/models/sanitizeRedirectPath";

export function buildSessionExpiredHref(path: string): string {
  return `/session/expired?${new URLSearchParams({ redirect: sanitizeRedirectPath(path) })}`;
}
