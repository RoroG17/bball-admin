import { daysBetween } from "@/models/daysBetween";

export type TimeSeriesBox = { width: number; height: number; padding: number };

export type TimeSeriesPoint = { x: number; y: number; date: string; value: number };

/**
 * Coordonnées SVG d'une série datée : abscisse proportionnelle au TEMPS (P14), ordonnée inversée. Domaine = `domain`
 * ou min–max élargi de 5 % ; valeurs toutes égales → ligne médiane ; un point ou dates identiques → centré.
 * L'entrée doit être triée par date.
 */
export function buildTimeSeriesPoints(
  points: readonly { date: string; value: number }[],
  box: TimeSeriesBox,
  domain?: { min: number; max: number },
): TimeSeriesPoint[] {
  if (points.length === 0) return [];
  const innerWidth = box.width - 2 * box.padding;
  const innerHeight = box.height - 2 * box.padding;
  const span = daysBetween(points[0].date, points[points.length - 1].date);

  const values = points.map((point) => point.value);
  let min = domain?.min ?? Math.min(...values);
  let max = domain?.max ?? Math.max(...values);
  if (!domain && max > min) {
    const margin = (max - min) * 0.05;
    min -= margin;
    max += margin;
  }

  return points.map((point) => {
    const x = span === 0 ? box.width / 2 : box.padding + (daysBetween(points[0].date, point.date) / span) * innerWidth;
    const y = max === min ? box.height / 2 : box.padding + (1 - (point.value - min) / (max - min)) * innerHeight;
    return { x, y, date: point.date, value: point.value };
  });
}
