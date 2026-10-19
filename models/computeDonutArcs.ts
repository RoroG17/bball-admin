import type { SeasonRecord } from "@/models/SeasonRecord";

export const DONUT_RADIUS = 52;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export type DonutArc = { dashArray: string; dashOffset: number };
export type DonutArcs = { win: DonutArc | null; loss: DonutArc | null };

const round = (n: number) => Math.round(n * 100) / 100;

/** Tracés `stroke-dasharray` des deux arcs de l'anneau victoires / défaites. */
export function computeDonutArcs({ wins, losses }: SeasonRecord, gap = 2.5): DonutArcs {
  const total = wins + losses;
  const c = DONUT_CIRCUMFERENCE;
  if (total === 0) return { win: null, loss: null };

  const full: DonutArc = { dashArray: `${round(c)} 0`, dashOffset: 0 };
  if (losses === 0) return { win: full, loss: null };
  if (wins === 0) return { win: null, loss: full };

  const winLen = c * (wins / total);
  return {
    win: { dashArray: `${round(winLen - gap)} ${round(c - winLen + gap)}`, dashOffset: 0 },
    loss: { dashArray: `${round(c - winLen - gap)} ${round(winLen + gap)}`, dashOffset: round(-(winLen + gap / 2)) },
  };
}
