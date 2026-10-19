export function computePoints(twoPointsMade: number, threePointsMade: number, freeThrowsMade: number): number {
  return 2 * twoPointsMade + 3 * threePointsMade + freeThrowsMade;
}
