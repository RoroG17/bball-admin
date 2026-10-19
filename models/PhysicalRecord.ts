import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";

export type PhysicalRecord = {
  /** Mesures de type connu, triées par date. */
  measurements: PhysicalMeasurement[];
  /** Mesures de type inconnu : écartées (jamais affichées comme une VMA) et signalées à l'admin (P6). */
  unknownEntries: { rawType: string; count: number }[];
};
