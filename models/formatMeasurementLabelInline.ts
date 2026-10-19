import { MEASUREMENT_LABELS, type MeasurementType } from "@/models/MeasurementType";

/** Libellé dans une phrase : « taille », « détente », « VMA ». */
export function formatMeasurementLabelInline(type: MeasurementType): string {
  return type === "vma" ? MEASUREMENT_LABELS.vma : MEASUREMENT_LABELS[type].toLocaleLowerCase("fr-FR");
}
