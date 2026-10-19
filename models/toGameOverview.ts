import type { CalendarGame } from "@/models/CalendarGame";
import type { Game } from "@/models/Game";
import { getGameOutcome } from "@/models/getGameOutcome";
import { getGameStatus } from "@/models/getGameStatus";
import { getRpbSideById } from "@/models/getRpbSideById";

/** Statut, côté du RPB et résultat d'un match de la fiche (même triplet que le calendrier). */
export function toGameOverview(game: Game, rpbTeamId: number | null, today: string): CalendarGame {
  const rpbSide = getRpbSideById(game, rpbTeamId);
  return { game, status: getGameStatus(game, today), rpbSide, outcome: getGameOutcome(game, rpbSide) };
}
