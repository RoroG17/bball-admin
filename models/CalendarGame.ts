import type { Game } from "@/models/Game";
import type { GameOutcome, GameSide } from "@/models/GameOutcome";
import type { GameStatus } from "@/models/GameStatus";

export type CalendarGame = {
  game: Game;
  status: GameStatus;
  /** Côté du RPB, `null` si inconnu (équipe non résolue ou non reconnue). */
  rpbSide: GameSide | null;
  /** Résultat du point de vue du RPB. N'a de sens que si `status === "played"`. */
  outcome: GameOutcome;
};
