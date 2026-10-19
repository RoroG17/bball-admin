import { formatDateTime } from "@/lib/format";
import type { LogKind } from "@/models/LogKind";

/** « l'erreur du 12/10/2026 14:02:11 » : sujet d'une action de ligne (nom accessible distinct par ligne). */
export function describeLogEntry(kind: LogKind, occurredAt: string): string {
  const date = formatDateTime(occurredAt, "Europe/Paris");
  return kind === "errors" ? `l'erreur du ${date}` : `la requête du ${date}`;
}
