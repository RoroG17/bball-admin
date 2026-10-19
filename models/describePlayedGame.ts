import type { Game } from "@/models/Game";
import type { GameOutcome } from "@/models/GameOutcome";

const OUTCOME_TEXT: Record<GameOutcome, string> = {
  win: "victoire",
  loss: "défaite",
  draw: "match nul",
  notEntered: "score à saisir",
  unknown: "",
};

/** Nom accessible du tableau de score : « Dernier match, n°11 : RPB 78, OTB 71, victoire. Voir la fiche. » */
export function describePlayedGame(game: Game, outcome: GameOutcome, isToday: boolean): string {
  const prefix = isToday ? "Match du jour" : "Dernier match";
  const teams =
    outcome === "notEntered"
      ? `${game.home.name} contre ${game.away.name}`
      : `${game.home.name} ${game.home.score}, ${game.away.name} ${game.away.score}`;
  const result = OUTCOME_TEXT[outcome] ? `, ${OUTCOME_TEXT[outcome]}` : "";
  return `${prefix}, n°${game.number} : ${teams}${result}. Voir la fiche.`;
}
