import { z } from "zod";
import { MEASUREMENT_TYPES } from "@/models/MeasurementType";

export const PhysicalMeasurementSchema = z.object({
  /** Entier MySQL converti en chaîne, ou identifiant JSONB. */
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(MEASUREMENT_TYPES),
  value: z.number().finite().nonnegative(),
});

export type PhysicalMeasurement = z.infer<typeof PhysicalMeasurementSchema>;
