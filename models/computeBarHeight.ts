/** Hauteur en px d'une barre, proportionnelle à `value` sur l'échelle `scale`. */
export function computeBarHeight(value: number, scale: number, maxHeightPx = 128): number {
  if (scale <= 0 || value <= 0) return 0;
  return Math.round((Math.min(value, scale) / scale) * maxHeightPx);
}
