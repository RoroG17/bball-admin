import { GAME_MESSAGES } from "@/models/adminGameMessages";
import type { GameSide } from "@/models/GameOutcome";

export type GameTeamsResolution =
  | { ok: true; homeTeamId: number; awayTeamId: number }
  | { ok: false; field: "seasonId" | "opponentId"; message: string };

/**
 * Équipes du match à partir de « équipe RPB de la saison + côté + adversaire » (recalculées côté serveur). Garantit des
 * équipes distinctes et le RPB d'un côté. Saison sans équipe RPB : refus (D-G3).
 */
export function resolveGameTeams(
  input: { side: GameSide; opponentId: number },
  rpbTeamId: number | null,
): GameTeamsResolution {
  if (rpbTeamId === null) return { ok: false, field: "seasonId", message: GAME_MESSAGES.noRpbTeam };
  if (input.opponentId === rpbTeamId) return { ok: false, field: "opponentId", message: GAME_MESSAGES.opponentIsRpb };
  return input.side === "home"
    ? { ok: true, homeTeamId: rpbTeamId, awayTeamId: input.opponentId }
    : { ok: true, homeTeamId: input.opponentId, awayTeamId: rpbTeamId };
}
