import { REGULATION_PERIODS } from "@/models/PeriodStats";

/** Court : « Q3 », « Prol. 1 ». Long (lecteurs d'écran) : « Quart-temps 3 », « Prolongation 1 ». */
export function formatPeriodLabel(period: number, style: "short" | "long" = "short"): string {
  if (period <= REGULATION_PERIODS) return style === "short" ? `Q${period}` : `Quart-temps ${period}`;
  const overtime = period - REGULATION_PERIODS;
  return style === "short" ? `Prol. ${overtime}` : `Prolongation ${overtime}`;
}
