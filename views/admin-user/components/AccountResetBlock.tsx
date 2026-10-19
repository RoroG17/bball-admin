import { notFound } from "next/navigation";
import { resetAccountPassword } from "@/actions/accountActions";
import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { buildAdminHref } from "@/models/buildAdminHref";
import { findAccountByUsername } from "@/models/findAccountByUsername";
import { getAccountLabel } from "@/models/getAccountLabel";
import { getAccountProtection } from "@/models/getAccountProtection";
import type { Session } from "@/models/Session";
import { listAccounts } from "@/repositories/AccountRepository";
import { AccountProtectedMessage } from "@/views/admin-user/components/AccountProtectedMessage";
import { AccountResetConsequences } from "@/views/admin-user/components/AccountResetConsequences";

type AccountResetBlockProps = {
  username: string;
  session: Pick<Session, "username" | "token">;
};

/**
 * Confirmation de réinitialisation. La liste est requise : lecture en échec → le bloc lève (« Réessayer »), aucun bouton.
 * Compte inconnu → « Compte introuvable » ; compte protégé → message sans formulaire.
 */
export async function AccountResetBlock({ username, session }: AccountResetBlockProps) {
  const account = findAccountByUsername(await listAccounts(session.token), username) ?? notFound();
  const listHref = buildAdminHref("user");
  const protection = getAccountProtection(account, session);
  if (protection !== null) return <AccountProtectedMessage protection={protection} listHref={listHref} />;

  return (
    <AdminConfirmPanel
      title={`Réinitialiser le mot de passe de ${getAccountLabel(account)} ?`}
      subject={`Identifiant : ${account.username}`}
      warning={ACCOUNT_MESSAGES.resetWarning}
    >
      <AccountResetConsequences account={account} />
      <AdminConfirmForm
        action={resetAccountPassword}
        fields={{ username: account.username }}
        tone="neutral"
        confirmLabel="Réinitialiser le mot de passe"
        busyLabel="Réinitialisation…"
        cancelHref={listHref}
      />
    </AdminConfirmPanel>
  );
}
