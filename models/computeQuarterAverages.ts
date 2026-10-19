import { computeTeamTotals } from "@/models/computeTeamTotals";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import type { QuarterAverages, QuarterValues } from "@/models/QuarterAverages";
import { splitOpponentLine } from "@/models/splitOpponentLine";
import { TEAM_STATS } from "@/models/TeamStat";

const QUARTERS = [1, 2, 3, 4] as const;

/**
 * Moyenne par match de l'équipe, quart-temps par quart-temps. Chaque élément de `games` est la liste des lignes de stats
 * d'un match. L'adversaire est écarté ; un match sans ligne de joueur du club n'est pas compté. `null` si aucun match.
 */
export function computeQuarterAverages(games: readonly (readonly PlayerGameStats[])[]): QuarterAverages | null {
  const teamLines = games.map((lines) => splitOpponentLine(lines).playerLines).filter((lines) => lines.length > 0);
  if (teamLines.length === 0) return null;

  const totals = teamLines.map((lines) => QUARTERS.map((quarter) => computeTeamTotals(lines, quarter)));
  return Object.fromEntries(
    TEAM_STATS.map((stat) => [
      stat,
      QUARTERS.map((_, index) => totals.reduce((sum, game) => sum + game[index][stat], 0) / teamLines.length) as unknown as QuarterValues,
    ]),
  ) as QuarterAverages;
}
