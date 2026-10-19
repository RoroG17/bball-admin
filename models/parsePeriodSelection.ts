import type { PeriodSelection } from "@/models/PeriodSelection";

/** Paramètre `?periode=` : `"q3"` (insensible à la casse) si la période existe, sinon `"all"`. */
export function parsePeriodSelection(raw: string | null, periods: readonly number[]): PeriodSelection {
  const match = raw?.match(/^q(\d{1,2})$/i);
  if (!match) return "all";
  const period = Number(match[1]);
  return periods.includes(period) ? period : "all";
}
