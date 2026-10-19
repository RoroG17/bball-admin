import type { ErrorLogEntry } from "@/models/ErrorLogEntry";

/** Méthode à afficher : jamais pour la source « client » (c'est celle de l'appel de remontée, trompeuse, P7). */
export function getDisplayedErrorMethod(entry: Pick<ErrorLogEntry, "source" | "method">): string | null {
  return entry.source === "client" ? null : entry.method;
}
