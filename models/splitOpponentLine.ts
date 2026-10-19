import type { PlayerGameStats } from "@/models/PlayerGameStats";

/** Licence de la ligne de stats qui représente l'équipe adverse (nom et prénom « Adversaire »). */
export const OPPONENT_LICENCE = "XXX";

export type SplitStatLines = {
  /** Lignes des joueurs du RPB, sans l'adversaire. */
  playerLines: PlayerGameStats[];
  /** Lignes de l'adversaire (normalement une seule). */
  opponentLines: PlayerGameStats[];
};

/** Sépare les lignes de l'adversaire de celles des joueurs : ses stats ne doivent pas entrer dans les totaux d'équipe. */
export function splitOpponentLine(lines: readonly PlayerGameStats[]): SplitStatLines {
  const isOpponent = (line: PlayerGameStats) => line.player.licence === OPPONENT_LICENCE;
  return { playerLines: lines.filter((line) => !isOpponent(line)), opponentLines: lines.filter(isOpponent) };
}
