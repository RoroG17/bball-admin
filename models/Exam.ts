import { z } from "zod";
import { ShotSchema } from "@/models/Shot";
import { SHOT_ZONES } from "@/models/ShotZone";

/** Tir d'examen : tir de la fiche match sans joueur ni période, avec une zone. */
export const ExamShotSchema = ShotSchema.pick({ id: true, made: true, position: true }).extend({
  /** `null` : type inconnu, compté au total mais dans aucune zone. */
  zone: z.enum(SHOT_ZONES).nullable(),
});

export const ExamSchema = z.object({
  id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shots: z.array(ExamShotSchema),
});

export type ExamShot = z.infer<typeof ExamShotSchema>;
export type Exam = z.infer<typeof ExamSchema>;
