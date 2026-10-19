import { formatDecimal, formatPercentPoints } from "@/lib/format";
import type { RankingCategory } from "@/models/RankingCategory";

/** `18.4` → `"18,4"` pour une moyenne, `57.6` → `"58 %"` pour un pourcentage. */
export function formatRankingValue(value: number, valueUnit: RankingCategory["valueUnit"]): string {
  return valueUnit === "percent" ? formatPercentPoints(value) : formatDecimal(value);
}
