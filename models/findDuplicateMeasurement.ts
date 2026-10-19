import type { AddMeasurementInput } from "@/models/AddMeasurementInput";
import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";

/** Mesure existante de même type à la même date (D9) : refus de l'ajout, protège aussi d'un double envoi. */
export function findDuplicateMeasurement(
  measurements: readonly PhysicalMeasurement[],
  input: Pick<AddMeasurementInput, "type" | "date">,
): PhysicalMeasurement | null {
  return measurements.find((measurement) => measurement.type === input.type && measurement.date === input.date) ?? null;
}
