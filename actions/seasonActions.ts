"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { authorizeAdminAction } from "@/actions/support/authorizeAdminAction";
import { checkSeasonReferences, type SeasonReferenceCheck } from "@/actions/support/checkSeasonReferences";
import { refreshAfterAdminWrite } from "@/actions/support/refreshAfterAdminWrite";
import { refreshAfterSeasonParticipantChange } from "@/actions/support/refreshAfterSeasonParticipantChange";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { buildAdminNoticeHref } from "@/models/buildAdminNoticeHref";
import { buildSeasonCreatedHref } from "@/models/buildSeasonCreatedHref";
import { formError, type ConfirmFormState, type FormValues } from "@/models/FormState";
import { mapParticipantFailure } from "@/models/mapParticipantFailure";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import type { ParticipantActionResult } from "@/models/ParticipantAction";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { parseSeasonId } from "@/models/parseSeasonId";
import { readFormValues } from "@/models/readFormValues";
import { SEASON_FAILURE_OPTIONS } from "@/models/seasonFailureOptions";
import {
  SEASON_FIELDS,
  SeasonInputSchema,
  type SeasonField,
  type SeasonFormState,
  type SeasonInput,
} from "@/models/SeasonInput";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import { zodErrorToFormState } from "@/models/zodErrorToFormState";
import {
  addSeasonParticipantRecord,
  createSeasonRecord,
  deleteSeasonRecord,
  listSeasonParticipantLicences,
  removeSeasonParticipantRecord,
  updateSeasonRecord,
} from "@/repositories/SeasonRepository";

const readHiddenId = (formData: FormData): number | null => {
  const raw = formData.get("id");
  return typeof raw === "string" ? parseSeasonId(raw) : null;
};

/** L'entrée vient du navigateur (non fiable) : saison entière positive, licence de 1 à 8 caractères alphanumériques. */
const ParticipantInputSchema = z.object({
  seasonId: z.number().int().positive().max(2_147_483_647),
  licence: z.string().refine((value) => parsePlayerLicence(value) !== null),
});

function toReferenceError(
  check: Exclude<SeasonReferenceCheck, { kind: "ok" }>,
  values: FormValues<SeasonField>,
): SeasonFormState {
  switch (check.kind) {
    case "teamGone":
      return formError(values, ADMIN_MESSAGES.fixFields, { teamId: SEASON_MESSAGES.teamGone });
    case "duplicate":
      return formError(values, SEASON_MESSAGES.duplicate);
    case "unavailable":
      return formError(values, SEASON_MESSAGES.teamsUnavailable);
  }
}

/** Création : garde, Zod, équipe et doublon vérifiés (échec fermé), écriture, rafraîchissement puis édition de la saison créée. */
export async function createSeason(_previous: SeasonFormState, formData: FormData): Promise<SeasonFormState> {
  const values = readFormValues(formData, SEASON_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const parsed = SeasonInputSchema.safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, SEASON_FIELDS, values);
  const input: SeasonInput = parsed.data;

  const check = await checkSeasonReferences(input, access.session.token);
  if (check.kind !== "ok") return toReferenceError(check, values);

  const result = await createSeasonRecord(input, access.session.token);
  if (result.kind !== "ok") return mapWriteFailure(result, values, SEASON_FAILURE_OPTIONS);

  refreshAfterAdminWrite("season", "create");
  redirect(buildSeasonCreatedHref(result.value.seasonId));
}

/** Modification : même validation que la création (la saison modifiée est exclue du doublon), 404 = saison disparue. */
export async function updateSeason(_previous: SeasonFormState, formData: FormData): Promise<SeasonFormState> {
  const values = readFormValues(formData, SEASON_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const seasonId = readHiddenId(formData);
  if (seasonId === null) return formError(values, SEASON_MESSAGES.seasonGone);

  const parsed = SeasonInputSchema.safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, SEASON_FIELDS, values);

  const check = await checkSeasonReferences(parsed.data, access.session.token, { excludeSeasonId: seasonId });
  if (check.kind !== "ok") return toReferenceError(check, values);

  const result = await updateSeasonRecord(seasonId, parsed.data, access.session.token);
  if (result.kind === "notFound") refreshAfterAdminWrite("season", "update");
  if (result.kind !== "ok") return mapWriteFailure(result, values, SEASON_FAILURE_OPTIONS);

  refreshAfterAdminWrite("season", "update");
  redirect(buildAdminNoticeHref("season", { code: "updated", ref: seasonId }));
}

/** Suppression : un seul DELETE, jamais de blocage applicatif (D-ADM-1) ; l'impact n'est pas recalculé ici. */
export async function deleteSeason(_previous: ConfirmFormState, formData: FormData): Promise<ConfirmFormState> {
  const access = await authorizeAdminAction();
  if (!access.ok) return formError({}, access.message);

  const seasonId = readHiddenId(formData);
  if (seasonId === null) return formError({}, ADMIN_MESSAGES.gone);

  const result = await deleteSeasonRecord(seasonId, access.session.token);
  if (result.kind === "ok") {
    refreshAfterAdminWrite("season", "delete");
    redirect(buildAdminNoticeHref("season", { code: "deleted" }));
  }
  if (result.kind === "notFound") {
    refreshAfterAdminWrite("season", "delete");
    return formError({}, ADMIN_MESSAGES.gone);
  }
  if (result.kind === "failed") return formError({}, ADMIN_MESSAGES.deleteFailed);
  return mapWriteFailure(result, {}, { fieldMap: {} });
}

function participantError(message: string): ParticipantActionResult {
  return { status: "error", message };
}

/**
 * Inscription d'un joueur à une saison, enregistrée immédiatement (D-S1). Idempotente : le back n'a pas de clé unique
 * sur `participer`, donc les inscrits sont relus avant d'écrire ; déjà inscrit = succès `unchanged` sans `POST`.
 */
export async function addSeasonParticipant(input: { seasonId: number; licence: string }): Promise<ParticipantActionResult> {
  const access = await authorizeAdminAction();
  if (!access.ok) return participantError(access.message);

  const parsed = ParticipantInputSchema.safeParse(input);
  if (!parsed.success) return participantError(SEASON_MESSAGES.participantGone);
  const { seasonId, licence } = parsed.data;

  let enrolled: ReadonlySet<string> | null;
  try {
    enrolled = await listSeasonParticipantLicences(seasonId, access.session.token);
  } catch (error) {
    unstable_rethrow(error);
    return participantError(ADMIN_MESSAGES.serverWrite);
  }
  if (enrolled === null) return participantError(SEASON_MESSAGES.participantGone);
  if (enrolled.has(licence)) return { status: "success", outcome: "unchanged" };

  const result = await addSeasonParticipantRecord(seasonId, licence, access.session.token);
  if (result.kind !== "ok") return participantError(mapParticipantFailure(result));

  refreshAfterSeasonParticipantChange();
  return { status: "success", outcome: "added" };
}

/** Retrait d'un joueur : naturellement idempotent (le back répond 200 même si rien n'est supprimé), aucune lecture préalable. */
export async function removeSeasonParticipant(input: { seasonId: number; licence: string }): Promise<ParticipantActionResult> {
  const access = await authorizeAdminAction();
  if (!access.ok) return participantError(access.message);

  const parsed = ParticipantInputSchema.safeParse(input);
  if (!parsed.success) return participantError(SEASON_MESSAGES.participantGone);

  const result = await removeSeasonParticipantRecord(parsed.data.seasonId, parsed.data.licence, access.session.token);
  if (result.kind !== "ok") return participantError(mapParticipantFailure(result));

  refreshAfterSeasonParticipantChange();
  return { status: "success", outcome: "removed" };
}
