import { z } from "zod";
import type { FormState } from "@/models/FormState";
import { SEASON_MESSAGES } from "@/models/seasonMessages";

export const SEASON_FIELDS = ["startYear", "endYear", "championship", "category", "teamId"] as const;
export type SeasonField = (typeof SEASON_FIELDS)[number];
export type SeasonFormState = FormState<SeasonField>;

export const SEASON_YEAR_MIN = 2000;
export const SEASON_YEAR_MAX = 2100;
/** `varchar(255)` du back. */
export const SEASON_TEXT_MAX = 255;

/** Champs du back vers champs du formulaire (utilisé par `mapWriteFailure`). */
export const SEASON_FIELD_MAP: Readonly<Record<string, SeasonField>> = {
  annee_debut: "startYear",
  annee_fin: "endYear",
  championnat: "championship",
  categorie: "category",
  equipe: "teamId",
};

/** Année de 4 chiffres (après `trim`) comprise entre 2000 et 2100. Aucune coercition : la conversion suit le test de forme. */
const yearField = (missing: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}$/, missing)
    .transform(Number)
    .pipe(z.number().min(SEASON_YEAR_MIN, SEASON_MESSAGES.yearRange).max(SEASON_YEAR_MAX, SEASON_MESSAGES.yearRange));

const textField = (required: string, tooLong: string) =>
  z.string().trim().min(1, required).max(SEASON_TEXT_MAX, tooLong);

/**
 * Schéma unique du formulaire et des actions (création et modification). Entrée : valeurs de formulaire (chaînes).
 * Jamais de `z.coerce` : un champ vide ne devient jamais 0. L'équipe est obligatoire (jamais `equipe = 0`).
 */
export const SeasonInputSchema = z
  .object({
    startYear: yearField(SEASON_MESSAGES.startYearRequired),
    endYear: yearField(SEASON_MESSAGES.endYearRequired),
    championship: textField(SEASON_MESSAGES.championshipRequired, SEASON_MESSAGES.championshipTooLong),
    category: textField(SEASON_MESSAGES.categoryRequired, SEASON_MESSAGES.categoryTooLong),
    teamId: z
      .string()
      .trim()
      .regex(/^[1-9]\d{0,9}$/, SEASON_MESSAGES.teamRequired)
      .transform(Number),
  })
  .superRefine((value, context) => {
    // Relation entre années : seulement si les deux sont valides (sinon l'erreur du champ suffit).
    if (typeof value.startYear !== "number" || typeof value.endYear !== "number") return;
    const gap = value.endYear - value.startYear;
    if (gap !== 0 && gap !== 1) {
      context.addIssue({ code: "custom", path: ["endYear"], message: SEASON_MESSAGES.yearOrder });
    }
  });

export type SeasonInput = z.infer<typeof SeasonInputSchema>;
