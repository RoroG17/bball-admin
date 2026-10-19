import { GAME_MESSAGES } from "@/models/adminGameMessages";
import type { GameFormField } from "@/models/GameFormField";
import type { MapWriteFailureOptions } from "@/models/mapWriteFailure";

/** Champs du back vers champs du formulaire (utilisé par `mapWriteFailure`). */
export const GAME_FIELD_MAP: Readonly<Record<string, GameFormField>> = {
  Id_Saison: "seasonId",
  numero: "round",
  date_match: "date",
  equipe_domicile: "opponentId",
  equipe_exterieur: "opponentId",
  score_domicile: "homeScore",
  score_exterieur: "awayScore",
  video: "video",
};

export const GAME_FAILURE_OPTIONS: MapWriteFailureOptions<GameFormField> = {
  fieldMap: GAME_FIELD_MAP,
  fieldMessages: {
    date: { invalid: GAME_MESSAGES.dateRejected },
    seasonId: { unknownReference: GAME_MESSAGES.seasonGone },
    opponentId: { unknownReference: GAME_MESSAGES.teamGone },
  },
};
