import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { LockIcon } from "@/components/ui/icons/LockIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import type { Account } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { buildAdminHref } from "@/models/buildAdminHref";
import { getAccountLabel } from "@/models/getAccountLabel";
import { getAccountProtection } from "@/models/getAccountProtection";
import type { Session } from "@/models/Session";

type AccountRowActionsProps = {
  account: Account;
  session: Pick<Session, "username">;
};

/**
 * « Réinitialiser Paul Durand » et « Supprimer Paul Durand » (compte sans joueur : l'identifiant). Compte protégé (le
 * sien, ou `admin`) : aucun bouton, « Compte protégé » et la raison pour les lecteurs d'écran. L'action refuse aussi.
 */
export function AccountRowActions({ account, session }: AccountRowActionsProps) {
  const protection = getAccountProtection(account, session);
  if (protection !== null) {
    return (
      <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-rpb-ink/72">
        <LockIcon size={16} strokeWidth={2.4} />
        {ACCOUNT_MESSAGES.protected}
        <span className="sr-only">. {ACCOUNT_MESSAGES.protection[protection]}</span>
      </span>
    );
  }
  const subject = getAccountLabel(account);
  return (
    <>
      <AdminRowAction
        href={buildAdminHref("user", { kind: "reset", id: account.username })}
        label="Réinitialiser"
        subject={subject}
        icon={<LockIcon size={16} strokeWidth={2.4} />}
      />
      <AdminRowAction
        href={buildAdminHref("user", { kind: "delete", id: account.username })}
        label="Supprimer"
        subject={subject}
        tone="danger"
        icon={<TrashIcon size={16} strokeWidth={2.4} />}
      />
    </>
  );
}
