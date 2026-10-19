"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { authorizeAdminAction } from "@/actions/support/authorizeAdminAction";
import { refreshAfterAdminWrite } from "@/actions/support/refreshAfterAdminWrite";
import { resolveAccountTarget } from "@/actions/support/resolveAccountTarget";
import { ACCOUNT_FAILURE_OPTIONS } from "@/models/accountFailureOptions";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { ACCOUNT_FIELDS, AccountInputSchema, type AccountFormState } from "@/models/AccountInput";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { buildAdminNoticeHref } from "@/models/buildAdminNoticeHref";
import { formError, type ConfirmFormState } from "@/models/FormState";
import { listPlayersWithoutAccount } from "@/models/listPlayersWithoutAccount";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { readFormValues } from "@/models/readFormValues";
import { zodErrorToFormState } from "@/models/zodErrorToFormState";
import {
  createAccount as createAccountRecord,
  deleteAccount as deleteAccountRecord,
  listAccountsFresh,
  resetAccountPassword as resetAccountPasswordRecord,
} from "@/repositories/AccountRepository";
import { listAllPlayers } from "@/repositories/PlayerRepository";

type PlayerCheck = { kind: "ok"; licence: string | null } | { kind: "unavailable" } | { kind: "unreadable" };

/**
 * Le joueur choisi (champ caché `joueur`, `""` = aucun) peut-il recevoir un compte ? Licence invalide ou déjà pourvue
 * d'un compte : `unavailable`. Lectures impossibles : `unreadable`, rien n'est écrit. `redirect()` est relancé.
 */
async function checkChosenPlayer(formData: FormData, token: string): Promise<PlayerCheck> {
  const raw = formData.get("joueur");
  if (typeof raw !== "string" || raw === "") return { kind: "ok", licence: null };
  const licence = parsePlayerLicence(raw);
  if (licence === null) return { kind: "unavailable" };
  try {
    const [players, accounts] = await Promise.all([listAllPlayers(), listAccountsFresh(token)]);
    const available = listPlayersWithoutAccount(players, accounts);
    return available.some((entry) => entry.player.licence === licence) ? { kind: "ok", licence } : { kind: "unavailable" };
  } catch (error) {
    unstable_rethrow(error);
    return { kind: "unreadable" };
  }
}

/**
 * Création manuelle d'un compte : garde, Zod (identifiant refusé AVANT tout appel au back : vide, espace, réservé,
 * trop long), joueur facultatif encore disponible, écriture, rafraîchissement puis retour à la liste avec le message.
 */
export async function createAccount(_previous: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const values = readFormValues(formData, ACCOUNT_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const parsed = AccountInputSchema.safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, ACCOUNT_FIELDS, values);

  const player = await checkChosenPlayer(formData, access.session.token);
  if (player.kind === "unavailable") return formError(values, ACCOUNT_MESSAGES.playerUnavailable);
  if (player.kind === "unreadable") return formError(values, ADMIN_MESSAGES.serverWrite);

  const result = await createAccountRecord(
    { username: parsed.data.username, licence: player.licence },
    access.session.token,
  );
  if (result.kind !== "ok") return mapWriteFailure(result, values, ACCOUNT_FAILURE_OPTIONS);

  refreshAfterAdminWrite("user", "create");
  redirect(buildAdminNoticeHref("user", { code: "created", ref: result.value.username }));
}

/** Réinitialisation du mot de passe : cible vérifiée sur une liste fraîche, protections refusées, idempotente. */
export async function resetAccountPassword(_previous: ConfirmFormState, formData: FormData): Promise<ConfirmFormState> {
  const access = await authorizeAdminAction();
  if (!access.ok) return formError({}, access.message);

  const target = await resolveAccountTarget(formData, access.session);
  if (!target.ok) return target.state;

  const result = await resetAccountPasswordRecord(target.account.username, access.session.token);
  if (result.kind === "ok") {
    refreshAfterAdminWrite("user", "update");
    redirect(buildAdminNoticeHref("user", { code: "reset" }));
  }
  if (result.kind === "notFound") {
    refreshAfterAdminWrite("user", "update");
    return formError({}, ACCOUNT_MESSAGES.gone);
  }
  return mapWriteFailure(result, {}, { fieldMap: {} });
}

/** Suppression : un seul DELETE, sur le nom de la liste. Le joueur rattaché n'est pas touché. */
export async function deleteAccount(_previous: ConfirmFormState, formData: FormData): Promise<ConfirmFormState> {
  const access = await authorizeAdminAction();
  if (!access.ok) return formError({}, access.message);

  const target = await resolveAccountTarget(formData, access.session);
  if (!target.ok) return target.state;

  const result = await deleteAccountRecord(target.account.username, access.session.token);
  if (result.kind === "ok") {
    refreshAfterAdminWrite("user", "delete");
    redirect(buildAdminNoticeHref("user", { code: "deleted" }));
  }
  if (result.kind === "notFound") {
    refreshAfterAdminWrite("user", "delete");
    return formError({}, ACCOUNT_MESSAGES.gone);
  }
  if (result.kind === "failed") return formError({}, ADMIN_MESSAGES.deleteFailed);
  return mapWriteFailure(result, {}, { fieldMap: {} });
}
