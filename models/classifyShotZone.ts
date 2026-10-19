import { BASKET, PAINT, THREE_POINT } from "@/lib/halfCourtGeometry";
import type { ShotZone } from "@/models/ShotZone";

/**
 * Zone d'un tir à partir de sa position sur le demi-terrain (viewBox 750 × 530, panier en haut) : raquette, au-delà de
 * l'arc ou dans les corners = 3 points, sinon mi-distance. Même découpage que la V1, corners en plus.
 */
export function classifyShotZone(point: { x: number; y: number }): ShotZone {
  const inPaint =
    point.x >= PAINT.x && point.x <= PAINT.x + PAINT.width && point.y >= PAINT.y && point.y <= PAINT.y + PAINT.height;
  if (inPaint) return "paint";
  const distance = Math.hypot(point.x - BASKET.cx, point.y - BASKET.cy);
  const outsideCorners = point.x < THREE_POINT.leftX || point.x > THREE_POINT.rightX;
  return distance > THREE_POINT.radius || outsideCorners ? "threePoint" : "midRange";
}
