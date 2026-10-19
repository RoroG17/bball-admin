import { pluralize } from "@/lib/format";

const BASE = "C'est l'équipe du club : elle sert à compter les victoires et les défaites.";

/** Indice permanent sous la liste d'équipes (D-S8). `null` = nombre de matchs inconnu. */
export function describeSeasonTeamHint(matchCount: number | null): string {
  if (matchCount === null) return `${BASE} Changer l'équipe peut modifier le bilan des matchs déjà joués.`;
  if (matchCount === 0) return BASE;
  const ofGames = matchCount === 1 ? "du match" : `des ${pluralize(matchCount, "match", "matchs")}`;
  return `${BASE} Changer l'équipe recalcule le bilan ${ofGames} de cette saison.`;
}
