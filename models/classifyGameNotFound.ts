import { normalizeSearchText } from "@/models/normalizeSearchText";

export type GameNotFoundKind = "game" | "season" | "team" | "unknown";

/**
 * Classe un 404 d'écriture (ambigu : match, saison ou équipe) d'après les phrases françaises de `MatchResource` :
 * « Match non trouvé », « La saison n'existe pas », « L'équipe n'existe pas ». Texte inconnu → `unknown`. Jamais affiché.
 */
export function classifyGameNotFound(backMessage: string | null): GameNotFoundKind {
  if (backMessage === null) return "unknown";
  const message = normalizeSearchText(backMessage);
  if (message.startsWith("match")) return "game";
  if (message.includes("saison")) return "season";
  if (message.includes("equipe")) return "team";
  return "unknown";
}
