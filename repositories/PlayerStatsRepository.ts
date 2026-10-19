import "server-only";
import { buildGameLog } from "@/models/buildGameLog";
import type { GameLogEntry } from "@/models/GameLogEntry";
import type { PlayerStatLine } from "@/models/PlayerStatLine";
import type { RpbTeam } from "@/models/RpbTeam";
import type { Season } from "@/models/Season";
import { PlayerStatLinesSliceDto, StatSeasonIdsSliceDto } from "@/repositories/dto/PlayerStatLineDto";
import { StatCountSliceDto } from "@/repositories/dto/StatLineDto";
import { listAllGames } from "@/repositories/GameRepository";
import { fetchPlayerDetailPayload } from "@/repositories/sources/playerDetailSource";
import { resolveRpbTeam } from "@/repositories/TeamRepository";

/** Lignes de stats du joueur. Format invalide → erreur (blocs de stats seulement). */
export async function listPlayerStatLines(licence: string): Promise<PlayerStatLine[]> {
  const payload = await fetchPlayerDetailPayload(licence);
  if (payload === null) return [];
  return PlayerStatLinesSliceDto.parse(payload).stats;
}

/**
 * Saisons où le joueur a des stats, sans valider les compteurs. Ne lève pas : `null` si illisible (la fiche utilise
 * alors les participations seules ; le bloc de stats affiche sa propre erreur).
 */
export async function listPlayerStatSeasonIds(licence: string): Promise<number[] | null> {
  const payload = await fetchPlayerDetailPayload(licence);
  if (payload === null) return [];
  const result = StatSeasonIdsSliceDto.safeParse(payload);
  return result.success ? [...new Set(result.data.stats.map((line) => line.Id_Saison))] : null;
}

/** Nombre de lignes de stats du joueur sans valider leur contenu (impact d'une suppression). `null` si illisible. */
export async function countPlayerStatLines(licence: string): Promise<number | null> {
  const payload = await fetchPlayerDetailPayload(licence);
  if (payload === null) return null;
  const result = StatCountSliceDto.safeParse(payload);
  return result.success ? result.data.stats.length : null;
}

/**
 * Journal de matchs du joueur, limité aux saisons fournies (périmètre du lecteur, Q3). Les appels HTTP sont dédupliqués
 * par requête (`cache`) : la synthèse et l'onglet Statistiques ne refont que le calcul.
 */
export async function getPlayerGameLog(
  licence: string,
  seasons: readonly Season[],
  today: string,
): Promise<GameLogEntry[]> {
  const seasonIds = new Set(seasons.map((season) => season.id));
  const [lines, games, resolutions] = await Promise.all([
    listPlayerStatLines(licence),
    listAllGames(),
    Promise.all(seasons.map(async (season) => [season.id, await resolveRpbTeam(season.teamId)] as const)),
  ]);
  const rpbTeams = new Map<number, RpbTeam | null>(
    resolutions.map(([seasonId, resolution]) => [seasonId, resolution.kind === "resolved" ? resolution.team : null]),
  );
  return buildGameLog(
    lines.filter((line) => seasonIds.has(line.seasonId)),
    games,
    rpbTeams,
    today,
  );
}
