import { z } from "zod";
import { parsePlayingTime } from "@/models/parsePlayingTime";
import { PlayerStatLineSchema } from "@/models/PlayerStatLine";
import { numeric } from "@/repositories/dto/numeric";
import { statCounterFields, toPeriodStats } from "@/repositories/dto/StatLineDto";

/** Ligne `stats[]` de `GET /api/joueurs/{licence}`. `licence`, `shoots` et toute autre clé sont ignorés. */
export const PlayerStatLineDto = z
  .object({
    id: numeric,
    Id_Match: numeric,
    Id_Saison: numeric,
    match_libelle: z.string(),
    minutes: z.string().nullable(),
    ...statCounterFields,
  })
  .transform((dto) => ({
    lineId: dto.id,
    gameId: dto.Id_Match,
    seasonId: dto.Id_Saison,
    gameLabel: dto.match_libelle,
    playingTimeSeconds: parsePlayingTime(dto.minutes),
    periods: toPeriodStats(dto),
  }))
  .pipe(PlayerStatLineSchema);

export const PlayerStatLinesSliceDto = z.object({ stats: z.array(PlayerStatLineDto) });

/** Saisons des lignes seulement, sans valider les compteurs : sert au contrôle d'accès (P4). */
export const StatSeasonIdsSliceDto = z.object({ stats: z.array(z.object({ Id_Saison: numeric })) });
