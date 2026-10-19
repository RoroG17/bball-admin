/**
 * Classement « compétition » sur une liste déjà triée : `[20, 18, 18, 15]` → rangs `1, 2, 2, 4`.
 * L'ordre d'entrée est conservé.
 */
export function assignRanks<T extends { value: number }>(sorted: readonly T[]): (T & { rank: number })[] {
  let rank = 0;
  return sorted.map((item, index) => {
    if (index === 0 || item.value !== sorted[index - 1].value) rank = index + 1;
    return { ...item, rank };
  });
}
