import type { Game } from "@/models/Game";
import type { GameStatus } from "@/models/GameStatus";

/**
 * Un score saisi fait foi, quelle que soit la date. Un 0-0 est « à venir » jusqu'au jour du match
 * compris (`today` = date de Paris), puis « score à saisir ». Les dates `YYYY-MM-DD` se comparent comme des chaînes.
 */
export function getGameStatus(game: Game, today: string): GameStatus {
  if (game.home.score !== 0 || game.away.score !== 0) return "played";
  return game.date >= today ? "upcoming" : "scoreMissing";
}
