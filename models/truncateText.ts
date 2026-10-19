/** Coupe à `maxChars` POINTS DE CODE (jamais au milieu d'un caractère de deux unités UTF-16). `maxChars` ≥ 1. */
export function truncateText(
  text: string,
  maxChars: number,
): { text: string; truncated: boolean; totalChars: number } {
  const chars = Array.from(text);
  if (chars.length <= maxChars) return { text, truncated: false, totalChars: chars.length };
  return { text: chars.slice(0, maxChars).join(""), truncated: true, totalChars: chars.length };
}
