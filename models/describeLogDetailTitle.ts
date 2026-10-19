import type { LogKind } from "@/models/LogKind";

/** Titre du panneau de détail : « Détail de l'erreur n° 1840 ». */
export function describeLogDetailTitle(kind: LogKind, id: number): string {
  return kind === "errors" ? `Détail de l'erreur n° ${id}` : `Détail de la requête n° ${id}`;
}
