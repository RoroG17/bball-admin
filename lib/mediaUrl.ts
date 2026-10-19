import "server-only";
import { env } from "@/lib/env";
import { joinMediaUrl } from "@/lib/joinMediaUrl";

export type MediaKind = "logo" | "joueur";

/** Dossier d'un type de média sur le back, avec son slash final : `http://api/public/images/logo/`. */
export function buildMediaBaseUrl(kind: MediaKind): string {
  return new URL(`/public/images/${kind}/`, env.BBALL_API_URL).toString();
}

/** Seul endroit où l'URL des médias servis par le back est construite. */
export function buildMediaUrl(kind: MediaKind, file: string | null | undefined): string | null {
  return joinMediaUrl(buildMediaBaseUrl(kind), file);
}
