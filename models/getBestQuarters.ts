/** Index (0 = Q1, ou première période de la liste) des quarts-temps à la valeur la plus haute, ex æquo compris. Vide si tout vaut 0. */
export function getBestQuarters(quarters: readonly number[]): number[] {
  const max = Math.max(...quarters);
  if (max <= 0) return [];
  return quarters.flatMap((value, index) => (value === max ? [index] : []));
}
