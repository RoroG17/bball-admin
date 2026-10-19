import type { GameDetail } from "@/models/GameDetail";
import type { GameFormField } from "@/models/GameFormField";
import { getRpbSideById } from "@/models/getRpbSideById";
import type { Season } from "@/models/Season";
import { toVideoFieldValue } from "@/models/toVideoFieldValue";

export type GameFormInitialValues = Readonly<Record<Exclude<GameFormField, `ack${string}`>, string>>;

/**
 * Valeurs initiales du formulaire de modification. Match qui n'oppose pas l'équipe RPB de sa saison : mode `fixed`
 * (équipes en lecture seule, D-G4). Scores 0 / 0 → champs vides (« non joué »).
 */
export function toGameFormValues(
  detail: GameDetail,
  season: Season,
): { values: GameFormInitialValues; teamsMode: "rpb" | "fixed" } {
  const { game } = detail;
  const rpbSide = getRpbSideById(game, season.teamId);
  const opponent = rpbSide === "home" ? game.away.teamId : rpbSide === "away" ? game.home.teamId : null;
  const played = game.home.score !== 0 || game.away.score !== 0;
  return {
    teamsMode: rpbSide === null ? "fixed" : "rpb",
    values: {
      seasonId: String(detail.seasonId),
      round: String(game.number),
      date: game.date,
      side: rpbSide ?? "",
      opponentId: opponent === null ? "" : String(opponent),
      homeScore: played ? String(game.home.score) : "",
      awayScore: played ? String(game.away.score) : "",
      video: toVideoFieldValue(detail.video),
    },
  };
}
