import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/ApiError";
import { apiGet, apiPost } from "@/lib/http";
import type { AddMeasurementInput } from "@/models/AddMeasurementInput";
import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";
import type { PhysicalRecord } from "@/models/PhysicalRecord";
import {
  BACK_MEASUREMENT_TYPES,
  PhysicalCreatedDto,
  PhysicalListDto,
} from "@/repositories/dto/PhysicalMeasurementDto";
import { ValidationErrorDto } from "@/repositories/dto/ValidationErrorDto";
import { getCurrentSession } from "@/repositories/SessionRepository";

/**
 * Mesures physiques du joueur (`GET /physics/{licence}`), une fois par requête. À n'appeler que si le lecteur y a droit.
 * Échec réseau ou format → erreur (blocs physiques seulement).
 */
export const getPhysicalRecord = cache(async (licence: string): Promise<PhysicalRecord> => {
  const session = await getCurrentSession();
  return PhysicalListDto.parse(await apiGet(`/physics/${encodeURIComponent(licence)}`, { token: session?.token }));
});

export type AddMeasurementWriteResult =
  | { kind: "ok"; measurement: PhysicalMeasurement }
  | { kind: "invalid"; errors: Record<string, string[]> }
  | { kind: "notFound" }
  | { kind: "failed" };

/**
 * `POST /api/physics`. Ne lève jamais : toute erreur devient un résultat typé (aucune exception brute vers l'interface).
 * La réponse est validée par le même DTO que la lecture. Ne journalise rien du payload.
 */
export async function addMeasurement(input: AddMeasurementInput, token: string): Promise<AddMeasurementWriteResult> {
  try {
    const created = await apiPost(
      "/api/physics",
      { date_physics: input.date, type: BACK_MEASUREMENT_TYPES[input.type], value: input.value, licence: input.licence },
      { token },
    );
    return { kind: "ok", measurement: PhysicalCreatedDto.parse(created) };
  } catch (error) {
    // Laisse passer `redirect()` (session expirée, 401) : sinon il serait avalé ici.
    unstable_rethrow(error);
    if (error instanceof ApiError && error.status === 404) return { kind: "notFound" };
    if (error instanceof ApiError && error.status === 422) {
      const body = ValidationErrorDto.safeParse(error.body);
      if (body.success) return { kind: "invalid", errors: body.data.errors };
    }
    return { kind: "failed" };
  }
}
