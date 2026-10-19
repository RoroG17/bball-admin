import type { GameAckField } from "@/models/GameFormField";

export type GameWarning =
  | { kind: "statsMove"; statLineCount: number | null; changed: readonly ("season" | "teams")[] }
  | { kind: "duplicateRound"; round: number }
  | { kind: "dateOutsideSeason"; startYear: number; endYear: number }
  | { kind: "scoreTie"; score: number };

export const GAME_WARNING_ACK_FIELD: Record<GameWarning["kind"], GameAckField> = {
  statsMove: "ackStatsMove",
  duplicateRound: "ackDuplicateRound",
  dateOutsideSeason: "ackDateOutsideSeason",
  scoreTie: "ackScoreTie",
};

export const GAME_WARNING_ACK_LABELS: Record<GameAckField, string> = {
  ackStatsMove: "Je confirme le déplacement des statistiques",
  ackDuplicateRound: "Je confirme : c'est bien un second match pour cette journée",
  ackDateOutsideSeason: "Je confirme cette date",
  ackScoreTie: "Je confirme cette égalité",
};
