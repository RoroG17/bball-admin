import "server-only";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import { StatCountSliceDto, StatLinesSliceDto } from "@/repositories/dto/StatLineDto";
import { fetchGameDetailPayload } from "@/repositories/sources/gameDetailSource";

/** Lignes de stats du match, dans l'ordre du back (nom, prénom). Format invalide → erreur (zone stats seule). */
export async function listGameStatLines(gameId: number): Promise<PlayerGameStats[]> {
  const payload = await fetchGameDetailPayload(gameId);
  if (payload === null) return [];
  return StatLinesSliceDto.parse(payload).stats;
}

/** Nombre de lignes de stats, sans valider leur contenu. Ne lève pas : `null` si inconnu. */
export async function countGameStatLines(gameId: number): Promise<number | null> {
  const payload = await fetchGameDetailPayload(gameId);
  if (payload === null) return null;
  const result = StatCountSliceDto.safeParse(payload);
  return result.success ? result.data.stats.length : null;
}
