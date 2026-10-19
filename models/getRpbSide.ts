import type { Game } from "@/models/Game";
import type { GameSide } from "@/models/GameOutcome";

function normalize(name: string): string {
  return name.trim().toLocaleLowerCase("fr-FR");
}

/** Côté du RPB dans le match, comparé par nom d'équipe. `null` si aucun côté ne correspond. */
export function getRpbSide(game: Game, rpbTeamName: string | null): GameSide | null {
  if (rpbTeamName === null || rpbTeamName.trim() === "") return null;
  const rpb = normalize(rpbTeamName);
  if (normalize(game.home.name) === rpb) return "home";
  if (normalize(game.away.name) === rpb) return "away";
  return null;
}
