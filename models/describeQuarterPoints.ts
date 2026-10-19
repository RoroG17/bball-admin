import { formatDecimal } from "@/lib/format";
import { formatQuarterList } from "@/models/formatQuarterList";
import type { QuarterValues } from "@/models/QuarterAverages";

/** Nom accessible de l'histogramme des points par quart-temps. */
export function describeQuarterPoints(points: QuarterValues, best: readonly number[]): string {
  const values = points.map((value, index) => `Q${index + 1} ${formatDecimal(value)}`).join(", ");
  const bestText = best.length > 0 ? ` Meilleur quart-temps : ${formatQuarterList(best)}.` : "";
  return `Points marqués par quart-temps, en moyenne par match : ${values}.${bestText}`;
}
