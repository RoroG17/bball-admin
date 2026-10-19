import "server-only";
import { computeQuarterAverages } from "@/models/computeQuarterAverages";
import type { QuarterAverages } from "@/models/QuarterAverages";
import { listGameStatLines } from "@/repositories/GameStatsRepository";
import { listSeasonGames } from "@/repositories/GameRepository";

/**
 * Moyennes de l'équipe par quart-temps, calculées ici à partir des stats de chaque match : le back les agrège
 * adversaire compris. `null` si aucune statistique n'est saisie.
 */
export async function getQuarterAverages(seasonId: number): Promise<QuarterAverages | null> {
  const games = await listSeasonGames(seasonId);
  return computeQuarterAverages(await Promise.all(games.map((game) => listGameStatLines(game.id))));
}
