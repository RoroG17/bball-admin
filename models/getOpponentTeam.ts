import type { CalendarGame } from "@/models/CalendarGame";
import type { GameTeam } from "@/models/GameTeam";

/** Adversaire du RPB ; `null` si le côté du RPB est inconnu (la vue affiche alors le libellé du match). */
export function getOpponentTeam(overview: CalendarGame): GameTeam | null {
  if (overview.rpbSide === "home") return overview.game.away;
  if (overview.rpbSide === "away") return overview.game.home;
  return null;
}
