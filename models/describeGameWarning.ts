import { pluralize } from "@/lib/format";
import type { GameWarning } from "@/models/GameWarning";

/** Texte de l'avertissement, affiché avec sa case « Je confirme ». */
export function describeGameWarning(warning: GameWarning): string {
  switch (warning.kind) {
    case "statsMove":
      return warning.statLineCount === null
        ? "Le nombre de lignes de statistiques de ce match est inconnu. S'il en a, changer la saison ou les équipes les déplace avec le match (moyennes, classements, fiches des joueurs)."
        : `Ce match a ${pluralize(warning.statLineCount, "ligne", "lignes")} de statistiques. Changer la saison ou les équipes les déplace avec le match : moyennes, classements et fiches des joueurs en seront modifiés.`;
    case "duplicateRound":
      return `La journée ${warning.round} existe déjà dans cette saison.`;
    case "dateOutsideSeason":
      return `Cette date n'est pas dans la saison ${warning.startYear}-${warning.endYear}.`;
    case "scoreTie":
      return `Les deux équipes ont le même score (${warning.score}). Un match de basket ne se termine normalement pas sur une égalité.`;
  }
}
