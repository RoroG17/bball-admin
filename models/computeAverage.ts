/** `null` sans match (jamais de division par zéro). */
export function computeAverage(total: number, count: number): number | null {
  return count <= 0 ? null : total / count;
}
