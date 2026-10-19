import type { Game } from "@/models/Game";
import type { GameSide } from "@/models/GameOutcome";
import { getRpbSide } from "@/models/getRpbSide";
import type { RpbTeam } from "@/models/RpbTeam";

/**
 * Côté du RPB : par identifiant d'équipe quand le match les fournit (sans repli par nom),
 * sinon par nom. Homonymes des deux côtés : `home` (limite levée par B2).
 */
export function resolveRpbSide(game: Game, rpbTeam: RpbTeam | null): GameSide | null {
  if (rpbTeam === null) return null;
  const { home, away } = game;
  if (home.teamId !== null && away.teamId !== null) {
    if (home.teamId === rpbTeam.id) return "home";
    if (away.teamId === rpbTeam.id) return "away";
    return null;
  }
  return getRpbSide(game, rpbTeam.name);
}
