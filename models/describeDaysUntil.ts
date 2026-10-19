/** `0` → « Aujourd'hui », `1` → « Demain », `n` → « Dans n jours ». Négatif : chaîne vide. */
export function describeDaysUntil(days: number): string {
  if (days < 0) return "";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}
