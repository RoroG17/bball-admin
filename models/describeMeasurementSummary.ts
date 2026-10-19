import { formatDate, formatMeasurementValue, formatSignedDecimal } from "@/lib/format";
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS } from "@/models/MeasurementType";
import type { MeasurementSummary } from "@/models/summarizeMeasurements";

const NBSP = " ";

/** « Taille : 182 cm le 12 mars 2026, +2 cm depuis le 5 janvier 2026 » ; « … (première mesure) » ; « stable depuis le … » (P15, P16). */
export function describeMeasurementSummary(summary: MeasurementSummary): string {
  const unit = MEASUREMENT_UNITS[summary.type];
  const base = `${MEASUREMENT_LABELS[summary.type]} : ${formatMeasurementValue(summary.latest.value, unit)} le ${formatDate(summary.latest.date)}`;
  if (summary.previous === null || summary.delta === null) return `${base} (première mesure)`;
  const since = `depuis le ${formatDate(summary.previous.date)}`;
  if (summary.delta === 0) return `${base}, stable ${since}`;
  return `${base}, ${formatSignedDecimal(summary.delta)}${NBSP}${unit} ${since}`;
}
