"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createAddMeasurementSchema } from "@/models/AddMeasurementInput";
import type { AddMeasurementField, AddMeasurementState, AddMeasurementValues } from "@/models/AddMeasurementState";
import { findDuplicateMeasurement } from "@/models/findDuplicateMeasurement";
import { formatMeasurementLabelInline } from "@/models/formatMeasurementLabelInline";
import { formatMeasurementValue } from "@/lib/format";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { hasPermission } from "@/models/hasPermission";
import { MEASUREMENT_UNITS } from "@/models/MeasurementType";
import { addMeasurement, getPhysicalRecord } from "@/repositories/PhysicalRepository";
import { getCurrentSession } from "@/repositories/SessionRepository";

const PLAYER_GONE = "Ce joueur n'existe plus.";
const NETWORK_FAILURE = "Échec de l'enregistrement. Vérifie ta connexion puis réessaie.";

/** Champs du back (422 Laravel) → champs du formulaire. */
const BACK_FIELDS: Record<string, AddMeasurementField> = { date_physics: "date", type: "type", value: "value" };

const readField = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const failure = (
  values: AddMeasurementValues,
  message: string | null,
  fieldErrors: Partial<Record<AddMeasurementField, string>> = {},
): AddMeasurementState => ({ status: "error", message, fieldErrors, values });

/**
 * Ajout d'une mesure physique (admin). Joignable par un POST direct : le rôle est TOUJOURS relu dans la session signée
 * (P3). Validation plus stricte que le back, refus d'un doublon même type / même date (D9), puis rafraîchissement de la
 * fiche (onglet et synthèse) depuis le serveur (P7).
 */
export async function addPhysicalMeasurement(
  _previous: AddMeasurementState,
  formData: FormData,
): Promise<AddMeasurementState> {
  const values: AddMeasurementValues = {
    date: readField(formData, "date"),
    type: readField(formData, "type"),
    value: readField(formData, "value"),
  };
  const licence = readField(formData, "licence");

  const session = await getCurrentSession();
  if (!session || !hasPermission(session, "managePlayerData")) return failure(values, "Action réservée aux administrateurs.");

  const parsed = createAddMeasurementSchema(getParisIsoDate(new Date())).safeParse({ licence, ...values });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<AddMeasurementField, string>> = {};
    let message: string | null = null;
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "licence") message ??= issue.message;
      else if (key === "date" || key === "type" || key === "value") fieldErrors[key] ??= issue.message;
    }
    return failure(values, message, fieldErrors);
  }
  const input = parsed.data;

  let duplicate;
  try {
    duplicate = findDuplicateMeasurement((await getPhysicalRecord(input.licence)).measurements, input);
  } catch (error) {
    // Laisse passer `redirect()` (session expirée, 401) : sinon il serait avalé ici.
    unstable_rethrow(error);
    return failure(values, NETWORK_FAILURE);
  }
  if (duplicate) {
    const existing = formatMeasurementValue(duplicate.value, MEASUREMENT_UNITS[duplicate.type]);
    return failure(values, null, {
      date: `Une mesure de ${formatMeasurementLabelInline(input.type)} existe déjà à cette date (${existing}).`,
    });
  }

  const result = await addMeasurement(input, session.token);
  switch (result.kind) {
    case "ok":
      revalidatePath(`/player/${encodeURIComponent(input.licence)}`);
      return { status: "success", measurement: result.measurement };
    case "notFound":
      return failure(values, PLAYER_GONE);
    case "invalid": {
      const fieldErrors: Partial<Record<AddMeasurementField, string>> = {};
      let message: string | null = null;
      for (const [field, messages] of Object.entries(result.errors)) {
        const target = BACK_FIELDS[field];
        if (target) fieldErrors[target] ??= messages[0];
        else if (field === "licence") message = PLAYER_GONE;
        else message ??= messages[0] ?? NETWORK_FAILURE;
      }
      return failure(values, message, fieldErrors);
    }
    case "failed":
      return failure(values, NETWORK_FAILURE);
  }
}
