/** Haut de l'échelle d'un histogramme : le max arrondi au multiple de 5 supérieur (5 au minimum). */
export function computeChartScale(values: readonly number[]): number {
  const max = Math.max(0, ...values);
  return Math.max(5, Math.ceil(max / 5) * 5);
}
