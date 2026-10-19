import { formatFixedDecimal, formatPercentPointsFixed } from "@/lib/format";
import type { HallOfFameCategory } from "@/models/HallOfFameCategory";
import type { HallOfFameMode } from "@/models/HallOfFameMode";
import { getHallOfFameDigits } from "@/models/getHallOfFameDigits";

/** `72.6` → `"72,6 %"`, `32` (match) → `"32"`, `12` (moyenne) → `"12,0"`. Jamais `NaN` : une valeur non finie → `"—"`. */
export function formatHallOfFameValue(value: number, category: HallOfFameCategory, mode: HallOfFameMode): string {
  if (!Number.isFinite(value)) return "—";
  const digits = getHallOfFameDigits(category, mode);
  return category.kind === "percent" ? formatPercentPointsFixed(value, digits) : formatFixedDecimal(value, digits);
}
