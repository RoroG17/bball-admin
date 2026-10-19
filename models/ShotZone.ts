export const SHOT_ZONES = ["paint", "midRange", "threePoint"] as const;

export type ShotZone = (typeof SHOT_ZONES)[number];

export const SHOT_ZONE_LABELS: Record<ShotZone, string> = {
  paint: "Raquette",
  midRange: "Mi-distance",
  threePoint: "3 points",
};
