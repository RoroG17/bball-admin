import { z } from "zod";
import type { MeasurementType } from "@/models/MeasurementType";
import { PhysicalMeasurementSchema } from "@/models/PhysicalMeasurement";
import type { PhysicalRecord } from "@/models/PhysicalRecord";
import { sortMeasurementsByDate } from "@/models/sortMeasurementsByDate";
import { numeric } from "@/repositories/dto/numeric";

/** Vocabulaires du back (Q7, D6) : `size` / `spring` (JSONB, lus par `getLastPhysics`), `height` / `vertical_jump` (MySQL). */
const RAW_MEASUREMENT_TYPES: Record<string, MeasurementType> = {
  size: "height",
  height: "height",
  spring: "verticalJump",
  vertical_jump: "verticalJump",
  vma: "vma",
};

/** Type écrit par la V2 : celui que lit `Physics::getLastPhysics`. */
export const BACK_MEASUREMENT_TYPES: Record<MeasurementType, string> = { height: "size", verticalJump: "spring", vma: "vma" };

const rawDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/)
  .transform((value) => value.slice(0, 10));

/** Les deux formes réelles du back : élément JSONB (PostgreSQL) ou ligne de la table `physics` (MySQL). */
const RawPhysicalEntryDto = z.union([
  z.object({ id: z.string().min(1), date_physics: rawDate, type: z.string(), value: numeric }),
  z.object({
    id: z.number().int(),
    date_physics: rawDate,
    type: z.string(),
    value: numeric,
    licence: z.string(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
  }),
]);

type RawPhysicalEntry = z.infer<typeof RawPhysicalEntryDto>;

function toMeasurement(entry: RawPhysicalEntry, type: MeasurementType) {
  return PhysicalMeasurementSchema.parse({ id: String(entry.id), date: entry.date_physics, type, value: entry.value });
}

/** Types connus → mesures triées ; types inconnus écartés et comptés (P6). */
export const PhysicalListDto = z.array(RawPhysicalEntryDto).transform((entries): PhysicalRecord => {
  const measurements = [];
  const unknown = new Map<string, number>();
  for (const entry of entries) {
    const type = Object.hasOwn(RAW_MEASUREMENT_TYPES, entry.type) ? RAW_MEASUREMENT_TYPES[entry.type] : undefined;
    if (type) measurements.push(toMeasurement(entry, type));
    else unknown.set(entry.type, (unknown.get(entry.type) ?? 0) + 1);
  }
  return {
    measurements: sortMeasurementsByDate(measurements),
    unknownEntries: [...unknown].map(([rawType, count]) => ({ rawType, count })),
  };
});

/** Réponse 201 de `POST /api/physics` : même conversion que la lecture ; un type inconnu est une erreur. */
export const PhysicalCreatedDto = RawPhysicalEntryDto.transform((entry, context) => {
  const type = Object.hasOwn(RAW_MEASUREMENT_TYPES, entry.type) ? RAW_MEASUREMENT_TYPES[entry.type] : undefined;
  if (!type) {
    context.addIssue({ code: "custom", message: "Type de mesure inconnu." });
    return z.NEVER;
  }
  return toMeasurement(entry, type);
});
