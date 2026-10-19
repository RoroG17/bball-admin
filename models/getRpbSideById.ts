import type { Game } from "@/models/Game";
import type { GameSide } from "@/models/GameOutcome";

/** Côté du RPB par identifiant d'équipe uniquement (pas de repli par nom, D13). */
export function getRpbSideById(game: Game, rpbTeamId: number | null): GameSide | null {
  if (rpbTeamId === null || game.home.teamId === null || game.away.teamId === null) return null;
  if (game.home.teamId === rpbTeamId) return "home";
  if (game.away.teamId === rpbTeamId) return "away";
  return null;
}
