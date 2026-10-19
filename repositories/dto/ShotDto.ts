import { z } from "zod";
import { normalizeShotPosition } from "@/models/normalizeShotPosition";
import { ShotSchema } from "@/models/Shot";
import { numeric } from "@/repositories/dto/numeric";

/** Tir brut : `id` entier (MySQL) ou UUID (PostgreSQL). Seul `is_reussi` est accepté (P15). */
const RawShotDto = z.object({
  id: z.union([z.number(), z.string().min(1)]),
  x: z.number().finite(),
  y: z.number().finite(),
  quarter: z.number().int().positive(),
  is_reussi: z.boolean(),
});

/** Tirs de toutes les lignes, aplatis, en repère normalisé (D6). */
export const ShotsSliceDto = z
  .object({
    stats: z.array(z.object({ id: numeric, licence: z.string().min(1), shoots: z.array(RawShotDto) })),
  })
  .transform(({ stats }) =>
    stats.flatMap((line) =>
      line.shoots.map((shot) => ({
        id: `${line.id}:${shot.id}`,
        playerLicence: line.licence,
        period: shot.quarter,
        made: shot.is_reussi,
        position: normalizeShotPosition(shot),
      })),
    ),
  )
  .pipe(z.array(ShotSchema));
