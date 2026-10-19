import { AdminNotice } from "@/components/admin/AdminNotice";
import type { AdminNotice as AdminNoticeData } from "@/models/AdminNotice";
import { describeAdminNotice } from "@/models/describeAdminNotice";
import { findAccountByUsername } from "@/models/findAccountByUsername";
import { listAccounts } from "@/repositories/AccountRepository";
import { readOrNull } from "@/repositories/support/readOrNull";
import { AccountCreatedNotice } from "@/views/admin-user/components/AccountCreatedNotice";

type AccountNoticeBlockProps = {
  notice: AdminNoticeData;
  cleanHref: string;
  token: string;
};

/**
 * Message de résultat après une écriture. Après une création, le compte est retrouvé par `ref` dans la liste (égalité
 * stricte, jamais affiché depuis l'URL) pour donner l'identifiant à communiquer ; liste illisible ou `ref` inconnue :
 * le message reste valable sans libellé.
 */
export async function AccountNoticeBlock({ notice, cleanHref, token }: AccountNoticeBlockProps) {
  const created =
    notice.code === "created" && notice.ref !== null
      ? findAccountByUsername((await readOrNull(() => listAccounts(token))) ?? [], notice.ref)
      : null;
  return (
    <div className="flex flex-col gap-3">
      <AdminNotice message={describeAdminNotice(notice.code, "user", created?.username ?? null)} cleanHref={cleanHref} />
      {created && <AccountCreatedNotice account={created} />}
    </div>
  );
}
