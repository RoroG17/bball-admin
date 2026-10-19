import type { GameOutcome } from "@/models/GameOutcome";

export const GAME_OUTCOME_LABELS: Record<GameOutcome, string> = {
  win: "Victoire",
  loss: "Défaite",
  draw: "Nul",
  notEntered: "Score à saisir",
  unknown: "",
};
