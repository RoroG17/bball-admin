import "server-only";
import { ApiError } from "@/lib/ApiError";
import { mapWithConcurrency } from "@/lib/mapWithConcurrency";
import type { SeasonDeletionFacts } from "@/models/SeasonDeletionFacts";
import { listSeasonGames } from "@/repositories/GameRepository";
import { countGameStatLines } from "@/repositories/GameStatsRepository";
import { listSeasonParticipantLicences } from "@/repositories/SeasonRepository";
import { readOrNull } from "@/repositories/support/readOrNull";

/** Lectures simultanées maximales de `GET /api/matchs/{id}` (payload lourd : stats et tirs) pour l'impact, D-S9. */
const STAT_READ_CONCURRENCY = 6;

/** Nombre de matchs de la saison, `null` si illisible (sert à l'indice de l'équipe). Ne lève jamais, sauf `redirect`. */
export async function countSeasonGames(seasonId: number): Promise<number | null> {
  return readOrNull(async () => (await listSeasonGames(seasonId)).length);
}

/**
 * Ce que la suppression d'une saison emporte. Matchs et participants sont indispensables : illisibles, la fonction lève
 * (pas de chiffre, la vue affiche son erreur). Saison disparue entre-temps : `ApiError(404)`. Les lignes de statistiques
 * sont la somme d'un appel par match (concurrence 6) ; un seul match illisible rend le total `null` (jamais 0).
 */
export async function getSeasonDeletionFacts(seasonId: number, token: string): Promise<SeasonDeletionFacts> {
  const [games, licences] = await Promise.all([listSeasonGames(seasonId), listSeasonParticipantLicences(seasonId, token)]);
  if (licences === null) throw new ApiError(404, `/api/saisons/${seasonId}`);

  const counts = await mapWithConcurrency(games, STAT_READ_CONCURRENCY, (game) => readOrNull(() => countGameStatLines(game.id)));
  const statLineCount = counts.some((count) => count === null)
    ? null
    : counts.reduce<number>((sum, count) => sum + (count ?? 0), 0);

  return { gameCount: games.length, participantCount: licences.size, statLineCount };
}
