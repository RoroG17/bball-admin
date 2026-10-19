import type { ShotPosition } from "@/models/Shot";

/**
 * Demi-terrain dans un `viewBox` `0 0 750 530`, aux proportions du dessin V1 (indispensable pour que
 * les tirs tombent au bon endroit, D6). Échelle : `FOOT` px par pied ; panier en haut.
 */
export const COURT_WIDTH = 750;
export const COURT_HEIGHT = 530;
export const FOOT = 10.4;
export const BASKET = { cx: 375, cy: 54.6, r: 7.8 } as const;
/** Raquette de 16 × 19 pieds, centrée. */
export const PAINT = { x: 291.8, y: 0, width: 166.4, height: 197.6 } as const;
export const FREE_THROW_RADIUS = 62.4;
/** Arc à 3 points (rayon 247) et segments droits à `x = 375 ± 228.8`. */
export const THREE_POINT = { radius: 247, leftX: 146.2, rightX: 603.8, cornerY: 147.66 } as const;
export const CENTER_CIRCLE_RADIUS = 62.4;

export function toCourtPoint(position: ShotPosition): { cx: number; cy: number } {
  return { cx: position.x * COURT_WIDTH, cy: position.y * COURT_HEIGHT };
}
