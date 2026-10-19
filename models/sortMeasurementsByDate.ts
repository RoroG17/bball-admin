import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";

const collator = new Intl.Collator("fr", { numeric: true });

/** Croissant par date, puis par identifiant (ordre numérique). Ne mute pas l'entrée. */
export function sortMeasurementsByDate(measurements: readonly PhysicalMeasurement[]): PhysicalMeasurement[] {
  return [...measurements].sort((a, b) => (a.date === b.date ? collator.compare(a.id, b.id) : a.date < b.date ? -1 : 1));
}
