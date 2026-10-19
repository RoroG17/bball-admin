import { formatDecimal } from "@/lib/format";
import { MEASUREMENT_RANGES, MEASUREMENT_UNITS, type MeasurementType } from "@/models/MeasurementType";

const NBSP = " ";

/** Aide sous le champ Valeur : « Entre 100 et 230 cm. » (DS57). */
export function describeMeasurementRange(type: MeasurementType): string {
  const { min, max } = MEASUREMENT_RANGES[type];
  return `Entre ${formatDecimal(min)} et ${formatDecimal(max)}${NBSP}${MEASUREMENT_UNITS[type]}.`;
}
