const DAY_MS = 86_400_000;

/** Nombre de jours de `from` à `to` (`YYYY-MM-DD`), calculé en UTC : aucun décalage d'heure d'été. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}
