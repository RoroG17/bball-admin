"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { authorizeAdminAction } from "@/actions/support/authorizeAdminAction";
import { refreshAfterAdminWrite } from "@/actions/support/refreshAfterAdminWrite";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { buildAdminNoticeHref } from "@/models/buildAdminNoticeHref";
import { findTeamNameConflict } from "@/models/findTeamNameConflict";
import { formError, type ConfirmFormState } from "@/models/FormState";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { parseTeamId } from "@/models/parseTeamId";
import { readFormValues } from "@/models/readFormValues";
import type { Team } from "@/models/Team";
import { TEAM_FIELDS, TeamInputSchema, type TeamFormState } from "@/models/TeamInput";
import { TEAM_FAILURE_OPTIONS } from "@/models/teamFailureOptions";
import { TEAM_MESSAGES } from "@/models/teamMessages";
import { zodErrorToFormState } from "@/models/zodErrorToFormState";
import { createTeamRecord, deleteTeamRecord, listTeams, updateTeamRecord } from "@/repositories/TeamRepository";

const readHiddenId = (formData: FormData): number | null => {
  const raw = formData.get("id");
  return typeof raw === "string" ? parseTeamId(raw) : null;
};

/** Relit la liste juste avant l'écriture pour le doublon. `null` = lecture impossible (échec fermé, D-T8). */
async function readTeamsForDuplicateCheck(token: string): Promise<Team[] | null> {
  try {
    return await listTeams(token);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

/** Création d'une équipe : garde, Zod, doublon, écriture, rafraîchissement puis retour à la liste. */
export async function createTeam(_previous: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const values = readFormValues(formData, TEAM_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const parsed = TeamInputSchema.safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, TEAM_FIELDS, values);

  const teams = await readTeamsForDuplicateCheck(access.session.token);
  if (teams === null) return formError(values, TEAM_MESSAGES.duplicateCheckUnavailable);
  const conflict = findTeamNameConflict(teams, parsed.data.name);
  if (conflict) return formError(values, ADMIN_MESSAGES.fixFields, { name: TEAM_MESSAGES.nameTaken(conflict.name) });

  const result = await createTeamRecord(parsed.data, access.session.token);
  if (result.kind !== "ok") return mapWriteFailure(result, values, TEAM_FAILURE_OPTIONS);

  refreshAfterAdminWrite("team", "create");
  redirect(buildAdminNoticeHref("team", { code: "created", ref: result.value.id ?? undefined }));
}

/** Modification : l'équipe doit exister, le retrait d'un logo est refusé (B-T1), le renommage ne crée pas de doublon. */
export async function updateTeam(_previous: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const values = readFormValues(formData, TEAM_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const id = readHiddenId(formData);
  if (id === null) return formError(values, ADMIN_MESSAGES.gone);

  const parsed = TeamInputSchema.safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, TEAM_FIELDS, values);

  const teams = await readTeamsForDuplicateCheck(access.session.token);
  if (teams === null) return formError(values, TEAM_MESSAGES.duplicateCheckUnavailable);
  const current = teams.find((team) => team.id === id);
  if (!current) return formError(values, ADMIN_MESSAGES.gone);

  const conflict = findTeamNameConflict(teams, parsed.data.name, id);
  if (conflict) return formError(values, ADMIN_MESSAGES.fixFields, { name: TEAM_MESSAGES.nameTaken(conflict.name) });
  if (parsed.data.logo === null && current.logoFile !== null) {
    return formError(values, ADMIN_MESSAGES.fixFields, { logo: TEAM_MESSAGES.logoCannotBeCleared });
  }

  const result = await updateTeamRecord(id, parsed.data, access.session.token);
  if (result.kind !== "ok") return mapWriteFailure(result, values, TEAM_FAILURE_OPTIONS);

  refreshAfterAdminWrite("team", "update");
  redirect(buildAdminNoticeHref("team", { code: "updated", ref: id }));
}

/** Suppression : un seul DELETE, jamais de blocage applicatif (D-ADM-1), l'impact n'est pas recalculé ici. */
export async function deleteTeam(_previous: ConfirmFormState, formData: FormData): Promise<ConfirmFormState> {
  const access = await authorizeAdminAction();
  if (!access.ok) return formError({}, access.message);

  const id = readHiddenId(formData);
  if (id === null) return formError({}, ADMIN_MESSAGES.gone);

  const result = await deleteTeamRecord(id, access.session.token);
  if (result.kind === "ok") {
    refreshAfterAdminWrite("team", "delete");
    redirect(buildAdminNoticeHref("team", { code: "deleted" }));
  }
  if (result.kind === "notFound") {
    refreshAfterAdminWrite("team", "delete");
    return formError({}, ADMIN_MESSAGES.gone);
  }
  if (result.kind === "failed") return formError({}, ADMIN_MESSAGES.deleteFailed);
  return mapWriteFailure(result, {}, { fieldMap: {} });
}
