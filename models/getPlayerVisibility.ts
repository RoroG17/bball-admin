import type { PlayerVisibility } from "@/models/PlayerVisibility";
import type { Session } from "@/models/Session";

/**
 * Règle de visibilité entre joueurs (Q1, D1) : SEUL endroit à modifier si le club change d'avis.
 * Admin : tout. Joueur sur sa propre fiche : tout sauf les actions admin. Autre joueur : stats de match seulement.
 */
export function getPlayerVisibility(viewer: Pick<Session, "role" | "licence">, targetLicence: string): PlayerVisibility {
  if (viewer.role === "admin") {
    return { matchStats: true, personalInfo: true, exams: true, physical: true, adminActions: true };
  }
  const isSelf = viewer.licence === targetLicence;
  return { matchStats: true, personalInfo: isSelf, exams: isSelf, physical: isSelf, adminActions: false };
}
