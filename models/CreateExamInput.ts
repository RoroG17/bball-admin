import { z } from "zod";
import { COURT_HEIGHT, COURT_WIDTH } from "@/lib/halfCourtGeometry";
import { isValidIsoDate } from "@/models/isValidIsoDate";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";

export const MAX_EXAM_SHOTS = 300;

/** Tir posé sur le demi-terrain (viewBox 750 × 530, entiers). La zone est recalculée côté serveur. */
export const DraftShotSchema = z.object({
  x: z.number().int().min(0).max(COURT_WIDTH),
  y: z.number().int().min(0).max(COURT_HEIGHT),
  made: z.boolean(),
});

export type DraftShot = z.infer<typeof DraftShotSchema>;

/** Saisie d'un examen : date existante et non future, au moins un tir. `today` est passé par l'appelant. */
export function createCreateExamSchema(today: string) {
  return z.object({
    licence: z.string().refine((value) => parsePlayerLicence(value) !== null, "Ce joueur n'existe plus."),
    date: z
      .string()
      .refine(isValidIsoDate, "Saisis une date valide.")
      .refine((value) => value <= today, "La date ne peut pas être dans le futur."),
    shots: z
      .array(DraftShotSchema, { error: "Place au moins un tir sur le terrain." })
      .min(1, "Place au moins un tir sur le terrain.")
      .max(MAX_EXAM_SHOTS, `Un examen ne peut pas dépasser ${MAX_EXAM_SHOTS} tirs.`),
  });
}

export type CreateExamInput = z.infer<ReturnType<typeof createCreateExamSchema>>;

export type CreateExamField = "date" | "shots";

/** État de la server action de création (`null` : rien d'envoyé ; en cas de succès l'action redirige). */
export type CreateExamState = {
  message: string | null;
  fieldErrors: Partial<Record<CreateExamField, string>>;
} | null;
