import type { CalendarGame } from "@/models/CalendarGame";
import type { Game } from "@/models/Game";
import { getGameOutcome } from "@/models/getGameOutcome";
import { getGameStatus } from "@/models/getGameStatus";
import { resolveRpbSide } from "@/models/resolveRpbSide";
import type { RpbTeam } from "@/models/RpbTeam";

export function toCalendarGame(game: Game, rpbTeam: RpbTeam | null, today: string): CalendarGame {
  const rpbSide = resolveRpbSide(game, rpbTeam);
  return { game, status: getGameStatus(game, today), rpbSide, outcome: getGameOutcome(game, rpbSide) };
}
