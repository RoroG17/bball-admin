import "server-only";
import type { Shot } from "@/models/Shot";
import { ShotsSliceDto } from "@/repositories/dto/ShotDto";
import { fetchGameDetailPayload } from "@/repositories/sources/gameDetailSource";

/** Tirs placés du match. Format invalide → erreur (carte des tirs seule). */
export async function listGameShots(gameId: number): Promise<Shot[]> {
  const payload = await fetchGameDetailPayload(gameId);
  if (payload === null) return [];
  return ShotsSliceDto.parse(payload);
}
