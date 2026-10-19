import type { GameStatus } from "@/models/GameStatus";

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  upcoming: "À venir",
  played: "Joué",
  scoreMissing: "Score à saisir",
};
