import type { FormState } from "@/models/FormState";

export const GAME_ACK_FIELDS = ["ackStatsMove", "ackDuplicateRound", "ackDateOutsideSeason", "ackScoreTie"] as const;
export type GameAckField = (typeof GAME_ACK_FIELDS)[number];

/** Champs lus par les actions de création et de modification (un champ absent du formulaire vaut `""`). */
export const GAME_FIELDS = [
  "seasonId",
  "round",
  "date",
  "side",
  "opponentId",
  "homeScore",
  "awayScore",
  "video",
  ...GAME_ACK_FIELDS,
] as const;
export type GameFormField = (typeof GAME_FIELDS)[number];
export type GameFormState = FormState<GameFormField>;
