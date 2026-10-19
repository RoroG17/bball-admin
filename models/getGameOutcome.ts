import type { Game } from "@/models/Game";
import type { GameOutcome, GameSide } from "@/models/GameOutcome";

/** Résultat du match du point de vue du RPB. Un `0-0` est considéré comme non saisi. */
export function getGameOutcome(game: Game, rpbSide: GameSide | null): GameOutcome {
  const { home, away } = game;
  if (home.score === 0 && away.score === 0) return "notEntered";
  if (rpbSide === null) return "unknown";
  if (home.score === away.score) return "draw";
  const rpbScore = rpbSide === "home" ? home.score : away.score;
  const opponentScore = rpbSide === "home" ? away.score : home.score;
  return rpbScore > opponentScore ? "win" : "loss";
}
