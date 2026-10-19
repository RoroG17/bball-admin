/** Ratio de réussite entre 0 et 1, sans arrondi. `null` sans tentative (jamais « 0 % » trompeur). */
export function computeShootingPercentage(made: number, attempted: number): number | null {
  return attempted <= 0 ? null : made / attempted;
}
