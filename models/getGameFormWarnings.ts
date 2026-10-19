import type { Game } from "@/models/Game";
import type { GameScores, GameValues } from "@/models/GameWriteInput";
import type { GameWarning } from "@/models/GameWarning";
import type { Season } from "@/models/Season";

export type GameWarningContext = {
  values: GameValues;
  scores: GameScores;
  /** Saison cible du match. */
  season: Season;
  /** Matchs de la saison cible. */
  seasonGames: readonly Game[];
  /** `null` = création. `statLineCount` nul = inconnu (compte comme « peut-être »). */
  current: { game: Game; seasonId: number; statLineCount: number | null } | null;
};

/**
 * Avertissements à acquitter avant d'écrire, dans un ordre fixe : déplacement de statistiques, doublon de journée, date
 * hors saison, égalité. Un avertissement déjà présent avant la modification n'est pas redemandé.
 */
export function getGameFormWarnings({ values, scores, season, seasonGames, current }: GameWarningContext): GameWarning[] {
  const warnings: GameWarning[] = [];
  const seasonChanged = current !== null && values.seasonId !== current.seasonId;

  if (current !== null && current.statLineCount !== 0) {
    const teamsChanged = values.homeTeamId !== current.game.home.teamId || values.awayTeamId !== current.game.away.teamId;
    if (seasonChanged || teamsChanged) {
      warnings.push({
        kind: "statsMove",
        statLineCount: current.statLineCount,
        changed: [...(seasonChanged ? (["season"] as const) : []), ...(teamsChanged ? (["teams"] as const) : [])],
      });
    }
  }

  const roundTouched = current === null || seasonChanged || values.round !== current.game.number;
  if (roundTouched && seasonGames.some((game) => game.id !== current?.game.id && game.number === values.round)) {
    warnings.push({ kind: "duplicateRound", round: values.round });
  }

  const dateTouched = current === null || seasonChanged || values.date !== current.game.date;
  const year = Number(values.date.slice(0, 4));
  if (dateTouched && (year < season.startYear || year > season.endYear)) {
    warnings.push({ kind: "dateOutsideSeason", startYear: season.startYear, endYear: season.endYear });
  }

  if (
    current !== null &&
    scores.home === scores.away &&
    scores.home > 0 &&
    (scores.home !== current.game.home.score || scores.away !== current.game.away.score)
  ) {
    warnings.push({ kind: "scoreTie", score: scores.home });
  }

  return warnings;
}
