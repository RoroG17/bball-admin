import type { ShotPosition } from "@/models/Shot";

/** Repère du dessin V1 (`HalfCourt.tsx` : terrain de (25, 25) à (775, 555), panier en haut). */
export const LEGACY_COURT = { originX: 25, originY: 25, width: 750, height: 530 } as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Coordonnées brutes du back → repère normalisé `[0, 1]`, bornées (P11, D6). */
export function normalizeShotPosition(raw: { x: number; y: number }): ShotPosition {
  return {
    x: clamp((raw.x - LEGACY_COURT.originX) / LEGACY_COURT.width),
    y: clamp((raw.y - LEGACY_COURT.originY) / LEGACY_COURT.height),
  };
}
