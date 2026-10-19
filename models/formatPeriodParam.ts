import type { PeriodSelection } from "@/models/PeriodSelection";

/** Valeur de `?periode=` ; `null` pour « Tout » (paramètre retiré de l'URL). */
export function formatPeriodParam(selection: PeriodSelection): string | null {
  return selection === "all" ? null : `q${selection}`;
}
