const DAY_MS = 86_400_000;

function toUtcDay(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Jours calendaires de `today` à `isoDate` (négatif si passé), insensible aux changements d'heure. */
export function countDaysUntil(isoDate: string, today: string): number {
  return Math.round((toUtcDay(isoDate) - toUtcDay(today)) / DAY_MS);
}
