import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";

export type AddMeasurementField = "date" | "type" | "value";

/** Saisie telle que tapée, renvoyée en cas d'erreur pour ne rien perdre. */
export type AddMeasurementValues = { date: string; type: string; value: string };

/** État de la server action d'ajout d'une mesure (`useActionState`). */
export type AddMeasurementState =
  | { status: "idle" }
  | { status: "success"; measurement: PhysicalMeasurement }
  | {
      status: "error";
      message: string | null;
      fieldErrors: Partial<Record<AddMeasurementField, string>>;
      values: AddMeasurementValues;
    };
