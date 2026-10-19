import "server-only";
import { cache } from "react";
import { apiGet } from "@/lib/http";
import type { Game } from "@/models/Game";
import type { GameDetail } from "@/models/GameDetail";
import type { GameTeamRef } from "@/models/GameTeamRef";
import type { PreviousAndNextGames } from "@/models/PreviousAndNextGames";
import type { SeasonRecord } from "@/models/SeasonRecord";
import { GameDetailSliceDto } from "@/repositories/dto/GameDetailDto";
import { GamesSliceDto, RecordSliceDto } from "@/repositories/dto/HomeSlicesDto";
import { SeasonGameListDto } from "@/repositories/dto/SeasonGameDto";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { fetchGameDetailPayload } from "@/repositories/sources/gameDetailSource";
import { fetchHomePayload } from "@/repositories/sources/homeSource";

export async function getPreviousAndNextGames(seasonId: number): Promise<PreviousAndNextGames> {
  const slice = GamesSliceDto.parse(await fetchHomePayload(seasonId));
  return { previous: slice.previousGame, next: slice.nextGame };
}

/** Nombre de victoires et de défaites. Un score égal n'est compté ni dans l'un ni dans l'autre. */
export async function getSeasonRecord(seasonId: number): Promise<SeasonRecord> {
  const slice = RecordSliceDto.parse(await fetchHomePayload(seasonId));
  return { wins: slice.ratioVictoire, losses: slice.ratioDefaite };
}

/** `GET /api/matchs`, une seule fois par requête serveur : partagé par le calendrier et la fiche joueur. */
const loadGameEntries = cache(async () => {
  const session = await getCurrentSession();
  return SeasonGameListDto.parse(await apiGet("/api/matchs", { token: session?.token }));
});

/**
 * Matchs d'une saison, non triés (le tri est fait par le modèle). Le back ne filtre pas encore par saison (B3) :
 * on charge la liste complète et on filtre ici. Dédupliqué par requête : un seul appel HTTP pour les deux blocs.
 */
export const listSeasonGames = cache(async (seasonId: number): Promise<Game[]> => {
  const entries = await loadGameEntries();
  return entries.filter((entry) => entry.seasonId === seasonId).map((entry) => entry.game);
});

/** Tous les matchs, toutes saisons (journal de matchs du joueur). */
export const listAllGames = cache(async (): Promise<Game[]> => {
  return (await loadGameEntries()).map((entry) => entry.game);
});

/**
 * Vue minimale de chaque match pour compter ceux d'une équipe (administration) : id, saison et NOMS des équipes. Même
 * appel HTTP que `listAllGames` (un seul par requête).
 */
export const listGameTeamRefs = cache(async (): Promise<GameTeamRef[]> => {
  return (await loadGameEntries()).map((entry) => ({
    gameId: entry.game.id,
    seasonId: entry.seasonId,
    homeName: entry.game.home.name,
    awayName: entry.game.away.name,
  }));
});

/** Match de la fiche. `null` si le match n'existe pas (404). Format invalide → erreur de page (l'affiche est indispensable). */
export async function getGameDetail(gameId: number): Promise<GameDetail | null> {
  const payload = await fetchGameDetailPayload(gameId);
  if (payload === null) return null;
  return GameDetailSliceDto.parse(payload).match;
}
