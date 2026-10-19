import { formatGameDate } from "@/lib/format";
import type { Game } from "@/models/Game";
import type { GameSide } from "@/models/GameOutcome";

/**
 * Nom accessible de la carte du prochain match, du point de vue du RPB quand son côté est connu :
 * « Prochain match, n°12 : RPB contre UBV, samedi 21 février 2026, à domicile. Voir la fiche. »
 */
export function describeUpcomingGame(game: Game, rpbSide: GameSide | null): string {
  const [first, second] = rpbSide === "away" ? [game.away, game.home] : [game.home, game.away];
  const venue = rpbSide === "home" ? ", à domicile" : rpbSide === "away" ? ", à l'extérieur" : "";
  return `Prochain match, n°${game.number} : ${first.name} contre ${second.name}, ${formatGameDate(game.date)}${venue}. Voir la fiche.`;
}
