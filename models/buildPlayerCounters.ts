import { filterGameLog } from "@/models/filterGameLog";
import type { GameLogEntry } from "@/models/GameLogEntry";
import type { PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";

export type PlayerCounters = {
  /** Matchs avec stats de la sélection. */
  selectionGames: number;
  /** Matchs distincts avec stats, toutes saisons visibles (doublons comptés une fois). */
  totalGames: number;
  /** `null` : compteur masqué (visibilité). */
  exams: number | null;
  seasons: number;
};

export function buildPlayerCounters(input: {
  log: readonly GameLogEntry[];
  selection: PlayerSeasonSelection;
  examCount: number | null;
  seasonCount: number;
}): PlayerCounters {
  return {
    selectionGames: filterGameLog(input.log, input.selection).length,
    totalGames: input.log.length,
    exams: input.examCount,
    seasons: input.seasonCount,
  };
}
