import type { ShotZone } from "@/models/ShotZone";

const ZONES: Record<string, ShotZone> = { Paint: "paint", "Mid-Range": "midRange", "3-Point": "threePoint" };

/** Valeurs écrites par l'écran de création d'examen ; tout le reste → `null` (pas de reclassement par position, Q9). */
export function parseShotZone(raw: string): ShotZone | null {
  return Object.hasOwn(ZONES, raw) ? ZONES[raw] : null;
}
