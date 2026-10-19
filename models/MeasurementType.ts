export const MEASUREMENT_TYPES = ["height", "verticalJump", "vma"] as const;

export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  height: "Taille",
  verticalJump: "Détente",
  vma: "VMA",
};

export const MEASUREMENT_UNITS: Record<MeasurementType, string> = { height: "cm", verticalJump: "cm", vma: "km/h" };

/** Plages plausibles de saisie (D12, à valider par le club). Bornes incluses. */
export const MEASUREMENT_RANGES: Record<MeasurementType, { min: number; max: number; step: number }> = {
  height: { min: 100, max: 230, step: 0.5 },
  verticalJump: { min: 5, max: 120, step: 0.5 },
  vma: { min: 5, max: 25, step: 0.1 },
};
