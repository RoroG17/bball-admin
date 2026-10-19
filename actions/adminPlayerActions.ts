"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { authorizeAdminAction } from "@/actions/support/authorizeAdminAction";
import { refreshAfterAdminWrite } from "@/actions/support/refreshAfterAdminWrite";
import { refreshAfterSeasonParticipantChange } from "@/actions/support/refreshAfterSeasonParticipantChange";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { buildAdminNoticeHref } from "@/models/buildAdminNoticeHref";
import { buildPlayerCreatedHref } from "@/models/buildPlayerCreatedHref";
import { formError, type ConfirmFormState } from "@/models/FormState";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { createPlayerInputSchema, PLAYER_FIELDS, type PlayerFormState } from "@/models/PlayerInput";
import { PLAYER_FAILURE_OPTIONS } from "@/models/playerFailureOptions";
import { readFormValues } from "@/models/readFormValues";
import { zodErrorToFormState } from "@/models/zodErrorToFormState";
import {
  createPlayerRecord,
  deletePlayerRecord,
  enrollPlayerInSeason,
  getPlayerEnrollment,
  updatePlayerRecord,
} from "@/repositories/AdminPlayerRepository";
import { readOrNull } from "@/repositories/support/readOrNull";
import { listTeams } from "@/repositories/TeamRepository";

function readHiddenLicence(formData: FormData): string | null {
  const raw = formData.get("licence");
  return typeof raw === "string" ? parsePlayerLicence(raw) : null;
}

/** Entier positif de la saison à inscrire (champ caché). */
function readHiddenSeasonId(formData: FormData): number | null {
  const raw = formData.get("seasonId");
  return typeof raw === "string" && /^[1-9]\d{0,9}$/.test(raw) ? Number(raw) : null;
}

/**
 * L'équipe choisie existe-t-elle ? Évite l'erreur SQL du back (D-P11). Lecture impossible → `true` : on écrit quand même
 * et le back tranche. `redirect()` (session expirée) est relancé.
 */
async function teamExists(teamId: number, token: string): Promise<boolean> {
  const teams = await readOrNull(() => listTeams(token));
  return teams === null || teams.some((team) => team.id === teamId);
}

/**
 * Création d'un joueur : garde, Zod, équipe existante, écriture, rafraîchissement puis page « joueur créé ». Création
 * non atomique côté back (joueur puis compte) : tout échec serveur ou réseau annonce que le joueur a peut-être été
 * créé sans son compte.
 */
export async function createPlayer(_previous: PlayerFormState, formData: FormData): Promise<PlayerFormState> {
  const values = readFormValues(formData, PLAYER_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const parsed = createPlayerInputSchema(getParisIsoDate(new Date())).safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, PLAYER_FIELDS, values);

  if (!(await teamExists(parsed.data.teamId, access.session.token))) {
    return formError(values, ADMIN_MESSAGES.fixFields, { teamId: ADMIN_PLAYER_MESSAGES.teamGone });
  }

  const result = await createPlayerRecord(parsed.data, access.session.token);
  if (result.kind === "failed") return formError(values, ADMIN_PLAYER_MESSAGES.createMaybePartial);
  if (result.kind !== "ok") return mapWriteFailure(result, values, PLAYER_FAILURE_OPTIONS);

  refreshAfterAdminWrite("player", "create");
  redirect(buildPlayerCreatedHref(result.value.licence));
}

/** Modification : même validation que la création (licence rejouée depuis le champ en lecture seule), palmarès invalidé. */
export async function updatePlayer(_previous: PlayerFormState, formData: FormData): Promise<PlayerFormState> {
  const values = readFormValues(formData, PLAYER_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const parsed = createPlayerInputSchema(getParisIsoDate(new Date())).safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, PLAYER_FIELDS, values);

  if (!(await teamExists(parsed.data.teamId, access.session.token))) {
    return formError(values, ADMIN_MESSAGES.fixFields, { teamId: ADMIN_PLAYER_MESSAGES.teamGone });
  }

  const result = await updatePlayerRecord(parsed.data, access.session.token);
  if (result.kind === "notFound") refreshAfterAdminWrite("player", "delete");
  if (result.kind !== "ok") return mapWriteFailure(result, values, PLAYER_FAILURE_OPTIONS);

  refreshAfterAdminWrite("player", "update");
  redirect(buildAdminNoticeHref("player", { code: "updated", ref: parsed.data.licence }));
}

/** Suppression : un seul DELETE, jamais de blocage applicatif (D-ADM-1) ; l'impact n'est pas recalculé ici. */
export async function deletePlayer(_previous: ConfirmFormState, formData: FormData): Promise<ConfirmFormState> {
  const access = await authorizeAdminAction();
  if (!access.ok) return formError({}, access.message);

  const licence = readHiddenLicence(formData);
  if (licence === null) return formError({}, ADMIN_MESSAGES.gone);

  const result = await deletePlayerRecord(licence, access.session.token);
  if (result.kind === "ok") {
    refreshAfterAdminWrite("player", "delete");
    redirect(buildAdminNoticeHref("player", { code: "deleted" }));
  }
  if (result.kind === "notFound") {
    refreshAfterAdminWrite("player", "delete");
    return formError({}, ADMIN_MESSAGES.gone);
  }
  if (result.kind === "failed") return formError({}, ADMIN_MESSAGES.deleteFailed);
  return mapWriteFailure(result, {}, { fieldMap: {} });
}

/**
 * Inscription à la saison choisie (la plus récente, D-P2). Idempotente : le back n'a pas de clé unique sur `participer`,
 * donc les inscriptions sont relues avant d'écrire ; déjà inscrit = succès sans `POST`.
 */
export async function enrollPlayer(_previous: ConfirmFormState, formData: FormData): Promise<ConfirmFormState> {
  const access = await authorizeAdminAction();
  if (!access.ok) return formError({}, access.message);

  const licence = readHiddenLicence(formData);
  const seasonId = readHiddenSeasonId(formData);
  if (licence === null || seasonId === null) return formError({}, ADMIN_MESSAGES.gone);

  let enrollment: Awaited<ReturnType<typeof getPlayerEnrollment>>;
  try {
    enrollment = await getPlayerEnrollment(licence, access.session.token);
  } catch (error) {
    unstable_rethrow(error);
    return formError({}, ADMIN_PLAYER_MESSAGES.enrollmentUnavailable);
  }
  if (!enrollment.seasons.some((season) => season.id === seasonId)) {
    return formError({}, ADMIN_PLAYER_MESSAGES.seasonGone);
  }
  if (enrollment.enrolledSeasonIds.includes(seasonId)) redirect(buildPlayerCreatedHref(licence));

  const result = await enrollPlayerInSeason(licence, seasonId, access.session.token);
  if (result.kind !== "ok") return mapWriteFailure(result, {}, { fieldMap: {} });

  refreshAfterSeasonParticipantChange();
  redirect(buildPlayerCreatedHref(licence));
}
