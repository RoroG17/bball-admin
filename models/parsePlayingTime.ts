/**
 * Temps de jeu en secondes. Formats du back : `"hh:mm:ss"`, ou l'ancien entier en minutes (`"32"`).
 * Tout autre format → `null` (affiché « — »).
 */
export function parsePlayingTime(raw: string | null): number | null {
  const value = raw?.trim() ?? "";
  const clock = value.match(/^(\d{1,2}):([0-5]\d):([0-5]\d)$/);
  if (clock) return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  if (/^\d{1,3}$/.test(value)) return Number(value) * 60;
  return null;
}
