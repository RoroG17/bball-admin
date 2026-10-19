import type { QuarterValues } from "@/models/QuarterAverages";

/** Q1 + Q2 + Q3 + Q4 = moyenne par match. Pas d'arrondi : il se fait au formatage. */
export function sumQuarters(quarters: QuarterValues): number {
  return quarters[0] + quarters[1] + quarters[2] + quarters[3];
}
