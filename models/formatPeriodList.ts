import { formatPeriodLabel } from "@/models/formatPeriodLabel";

/** `[2, 3]` → `"Q2 et Q3"`, `[1, 2, 5]` → `"Q1, Q2 et Prol. 1"`. Pendant de `formatQuarterList` pour des périodes. */
export function formatPeriodList(periods: readonly number[]): string {
  const labels = periods.map((period) => formatPeriodLabel(period));
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}
