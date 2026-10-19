/** Arrondi à `digits` décimales : `(72.65, 1)` → `72.7`, `(12, 0)` → `12`. */
export function roundToDigits(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
