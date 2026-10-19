import "server-only";
import { unstable_rethrow } from "next/navigation";
import { refreshAfterAdminWrite } from "@/actions/support/refreshAfterAdminWrite";
import type { Account } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { findAccountByUsername } from "@/models/findAccountByUsername";
import { formError, type ConfirmFormState } from "@/models/FormState";
import { getAccountProtection } from "@/models/getAccountProtection";
import { parseAccountUsername } from "@/models/parseAccountUsername";
import type { Session } from "@/models/Session";
import { listAccountsFresh } from "@/repositories/AccountRepository";

export type AccountTarget = { ok: true; account: Account } | { ok: false; state: ConfirmFormState };

/**
 * Cible d'une action sur un compte (réinitialiser, supprimer). Le nom reçu du formulaire n'est JAMAIS envoyé au back tel
 * quel : la liste est relue À NEUF et seul un `username` strictement égal à un compte listé est retenu (un nom forgé,
 * `ADMIN` ou `admin `, ne peut pas viser la ligne `admin` par alias de collation). Lecture impossible : échec fermé,
 * rien n'est écrit. Le compte connecté et tout compte `admin` sont refusés (D-U3). Le nom à écrire ensuite est
 * `account.username`, la valeur de la liste.
 */
export async function resolveAccountTarget(formData: FormData, session: Session): Promise<AccountTarget> {
  const raw = formData.get("username");
  const username = typeof raw === "string" ? parseAccountUsername(raw) : null;
  if (username === null) return { ok: false, state: formError({}, ACCOUNT_MESSAGES.gone) };

  let accounts: Account[];
  try {
    accounts = await listAccountsFresh(session.token);
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, state: formError({}, ACCOUNT_MESSAGES.targetUnreadable) };
  }

  const account = findAccountByUsername(accounts, username);
  if (account === null) {
    // La ligne fantôme disparaît de la liste.
    refreshAfterAdminWrite("user", "delete");
    return { ok: false, state: formError({}, ACCOUNT_MESSAGES.gone) };
  }

  const protection = getAccountProtection(account, session);
  if (protection !== null) return { ok: false, state: formError({}, ACCOUNT_MESSAGES.protection[protection]) };
  return { ok: true, account };
}
