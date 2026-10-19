import { z } from "zod";
import { ExamSchema } from "@/models/Exam";
import { normalizeShotPosition } from "@/models/normalizeShotPosition";
import { parseShotZone } from "@/models/parseShotZone";
import { numeric } from "@/repositories/dto/numeric";

/** Tir d'examen brut : `id` entier ou chaîne, `x` / `y` dans le repère du dessin V1. Seul `is_reussi` est accepté (P17). */
const RawExamShotDto = z.object({
  id: z.union([z.number(), z.string().min(1)]),
  x: z.number().finite(),
  y: z.number().finite(),
  type: z.string(),
  is_reussi: z.boolean(),
});

/** `joueur_id` ignoré ; `shoots` `null` (JSONB vide) → aucun tir. */
export const ExamDto = z
  .object({
    id: numeric,
    date_examen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    shoots: z.array(RawExamShotDto).nullable(),
  })
  .transform((dto) => ({
    id: dto.id,
    date: dto.date_examen,
    shots: (dto.shoots ?? []).map((shot) => ({
      id: `${dto.id}:${shot.id}`,
      made: shot.is_reussi,
      position: normalizeShotPosition(shot),
      zone: parseShotZone(shot.type),
    })),
  }))
  .pipe(ExamSchema);

export const ExamsSliceDto = z.object({ examens: z.array(ExamDto) });

/** Nombre d'examens sans valider leur contenu (compteur de la synthèse). */
export const ExamCountSliceDto = z.object({ examens: z.array(z.unknown()) });
