import { notFound } from "next/navigation";
import { deleteAccount } from "@/actions/accountActions";
import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { buildAdminHref } from "@/models/buildAdminHref";
import { findAccountByUsername } from "@/models/findAccountByUsername";
import { getAccountLabel } from "@/models/getAccountLabel";
import { getAccountProtection } from "@/models/getAccountProtection";
import type { Session } from "@/models/Session";
import { listAccounts } from "@/repositories/AccountRepository";
import { AccountDeletionConsequences } from "@/views/admin-user/components/AccountDeletionConsequences";
import { AccountProtectedMessage } from "@/views/admin-user/components/AccountProtectedMessage";

type AccountDeleteBlockProps = {
  username: string;
  session: Pick<Session, "username" | "token">;
};

/** Confirmation de suppression d'un compte (D-U6 : liste de conséquences, pas d'impact chiffré). Même garde que la réinitialisation. */
export async function AccountDeleteBlock({ username, session }: AccountDeleteBlockProps) {
  const account = findAccountByUsername(await listAccounts(session.token), username) ?? notFound();
  const listHref = buildAdminHref("user");
  const protection = getAccountProtection(account, session);
  if (protection !== null) return <AccountProtectedMessage protection={protection} listHref={listHref} />;

  return (
    <AdminConfirmPanel
      title={`Supprimer le compte de ${getAccountLabel(account)} ?`}
      subject={`Identifiant : ${account.username}`}
      warning={ACCOUNT_MESSAGES.deleteWarning}
    >
      <AccountDeletionConsequences account={account} />
      <AdminConfirmForm
        action={deleteAccount}
        fields={{ username: account.username }}
        confirmLabel="Supprimer définitivement"
        busyLabel="Suppression…"
        cancelHref={listHref}
      />
    </AdminConfirmPanel>
  );
}
