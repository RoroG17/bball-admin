import type { MeasurementType } from "@/models/MeasurementType";
import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";
import { sortMeasurementsByDate } from "@/models/sortMeasurementsByDate";

export type MeasurementSummary = {
  type: MeasurementType;
  latest: PhysicalMeasurement;
  previous: PhysicalMeasurement | null;
  /** `latest − previous`, arrondi à une décimale ; `null` sans mesure précédente. */
  delta: number | null;
  count: number;
};

/** Dernière mesure du type et écart avec la précédente. `null` si aucune mesure de ce type. */
export function summarizeMeasurements(
  measurements: readonly PhysicalMeasurement[],
  type: MeasurementType,
): MeasurementSummary | null {
  const sorted = sortMeasurementsByDate(measurements.filter((measurement) => measurement.type === type));
  const latest = sorted.at(-1);
  if (!latest) return null;
  const previous = sorted.at(-2) ?? null;
  return {
    type,
    latest,
    previous,
    delta: previous === null ? null : Math.round((latest.value - previous.value) * 10) / 10,
    count: sorted.length,
  };
}
