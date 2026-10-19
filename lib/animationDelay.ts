import type { CSSProperties } from "react";

/**
 * Délai d'une animation en cascade. Seule exception à la règle « pas de style inline ».
 * Ne pas l'utiliser sur les animations `on-scroll` (le délai fausserait la progression).
 */
export function animationDelay(ms: number | undefined): CSSProperties | undefined {
  return ms === undefined ? undefined : { animationDelay: `${ms}ms` };
}
