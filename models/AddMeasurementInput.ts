import { z } from "zod";
import { formatDecimal } from "@/lib/format";
import { formatMeasurementLabelInline } from "@/models/formatMeasurementLabelInline";
import { isValidIsoDate } from "@/models/isValidIsoDate";
import { MEASUREMENT_RANGES, MEASUREMENT_TYPES, MEASUREMENT_UNITS } from "@/models/MeasurementType";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";

const NBSP = " ";

/**
 * Saisie d'une mesure, plus stricte que le back (P6) : type fermé, valeur dans la plage du type (virgule acceptée),
 * date existante et non future. `today` est passé par l'appelant (`getParisIsoDate`).
 */
export function createAddMeasurementSchema(today: string) {
  return z
    .object({
      licence: z.string().refine((value) => parsePlayerLicence(value) !== null, "Ce joueur n'existe plus."),
      type: z.enum(MEASUREMENT_TYPES, { error: "Choisis une mesure." }),
      value: z
        .string()
        .trim()
        // `abort` : sans nombre, pas de contrôle de plage (un seul message sur le champ).
        .regex(/^\d+([.,]\d+)?$/, { error: "Saisis une valeur numérique.", abort: true })
        .transform((raw) => Number(raw.replace(",", "."))),
      date: z
        .string()
        .refine(isValidIsoDate, "Saisis une date valide.")
        .refine((value) => value <= today, "La date ne peut pas être dans le futur."),
    })
    .superRefine((input, context) => {
      const { min, max } = MEASUREMENT_RANGES[input.type];
      if (input.value < min || input.value > max) {
        context.addIssue({
          code: "custom",
          path: ["value"],
          message: `La ${formatMeasurementLabelInline(input.type)} doit être comprise entre ${formatDecimal(min)} et ${formatDecimal(max)}${NBSP}${MEASUREMENT_UNITS[input.type]}.`,
        });
      }
    });
}

export type AddMeasurementInput = z.infer<ReturnType<typeof createAddMeasurementSchema>>;
