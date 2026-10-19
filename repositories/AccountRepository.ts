import "server-only";
import { cache } from "react";
import { apiDelete, apiPost, apiPut } from "@/lib/http";
import type { Account } from "@/models/Account";
import type { CreateAccountInput } from "@/models/AccountInput";
import type { WriteResult } from "@/models/WriteFailure";
import { AccountsDto, CreatedAccountDto } from "@/repositories/dto/AccountDto";
import { fetchUsersPayload, fetchUsersPayloadFresh } from "@/repositories/sources/usersSource";
import { runWrite } from "@/repositories/support/runWrite";

/**
 * Comptes pour un rendu : une seule lecture HTTP par requête (`usersSource`). Ordre du back conservé (tri dans la vue).
 * Format invalide → lève : seul le bloc qui l'appelle est en erreur.
 */
export const listAccounts = cache(async (token: string): Promise<Account[]> => {
  return AccountsDto.parse(await fetchUsersPayload(token));
});

/**
 * Comptes lus À NEUF, hors cache : pour les actions, qui décident sur l'état réel du back juste avant d'écrire.
 * Lève si la lecture ou le format échoue (l'appelant n'écrit alors pas : échec fermé).
 */
export async function listAccountsFresh(token: string): Promise<Account[]> {
  return AccountsDto.parse(await fetchUsersPayloadFresh(token));
}

/**
 * `POST /api/users`. Le back valide `username` seul et crée le compte sans joueur (B6) : `joueur` est quand même envoyé
 * quand il est choisi (prêt pour B6). `linked` : le joueur demandé figure-t-il dans la réponse ? `null` si aucun joueur
 * n'était demandé ou si la réponse est illisible.
 */
export async function createAccount(
  input: CreateAccountInput,
  token: string,
): Promise<WriteResult<{ username: string; linked: boolean | null }>> {
  const payload = input.licence === null ? { username: input.username } : { username: input.username, joueur: input.licence };
  const result = await runWrite(() => apiPost("/api/users", payload, { token }));
  if (result.kind !== "ok") return result;
  const created = CreatedAccountDto.safeParse(result.value);
  if (!created.success) return { kind: "ok", value: { username: input.username, linked: null } };
  const linked = input.licence === null ? null : created.data.joueur === input.licence;
  return { kind: "ok", value: { username: created.data.username, linked } };
}

/** `PUT /api/users/{username}` sans corps : efface le mot de passe (idempotent). 404 → `notFound`. */
export async function resetAccountPassword(username: string, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiPut(`/api/users/${encodeURIComponent(username)}`, undefined, { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/** `DELETE /api/users/{username}` : un seul appel. 404 → `notFound`. Le joueur n'est pas touché. */
export async function deleteAccount(username: string, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiDelete(`/api/users/${encodeURIComponent(username)}`, { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}
