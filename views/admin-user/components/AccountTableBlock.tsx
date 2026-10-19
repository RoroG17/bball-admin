import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminTable } from "@/components/admin/AdminTable";
import { GroupIcon } from "@/components/ui/icons/GroupIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import type { Account } from "@/models/Account";
import { ACCOUNT_LIST_SPEC, type AccountStatusFilter } from "@/models/AccountListSpec";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import type { AdminListQuery } from "@/models/AdminListQuery";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { describeAccountListCaption } from "@/models/describeAccountListCaption";
import { filterAccounts } from "@/models/filterAccounts";
import type { Session } from "@/models/Session";
import { sortAccounts } from "@/models/sortAccounts";
import { toggleSort } from "@/models/toggleSort";
import { listAccounts } from "@/repositories/AccountRepository";
import { AccountBadges } from "@/views/admin-user/components/AccountBadges";
import { AccountPasswordStatus } from "@/views/admin-user/components/AccountPasswordStatus";
import { AccountPlayerCell } from "@/views/admin-user/components/AccountPlayerCell";
import { AccountRowActions } from "@/views/admin-user/components/AccountRowActions";
import { AccountUsernameCell } from "@/views/admin-user/components/AccountUsernameCell";

type AccountTableBlockProps = {
  query: AdminListQuery;
  status: AccountStatusFilter | null;
  session: Pick<Session, "username" | "token">;
  /** Identifiant du compte qui vient d'être créé (ligne mise en évidence). */
  highlight: string | null;
};

const BASE_PATH = buildAdminHref("user");

/** Liste des comptes. Une lecture en échec fait échouer le bloc (« Réessayer ») : jamais un tableau vide trompeur. */
export async function AccountTableBlock({ query, status, session, highlight }: AccountTableBlockProps) {
  const accounts = await listAccounts(session.token);
  const visible = sortAccounts(filterAccounts(accounts, { q: query.q, status }), query.sort);
  const caption = describeAccountListCaption(visible.length, accounts.length, query.sort);

  if (visible.length === 0) {
    return accounts.length === 0 ? (
      <AdminEmptyState
        kind="none"
        icon={<GroupIcon size={40} strokeWidth={1.6} />}
        title={ACCOUNT_MESSAGES.emptyNoneTitle}
        text={ACCOUNT_MESSAGES.emptyNoneText}
        caption={caption}
        action={{ href: buildAdminHref("user", "create"), label: "Nouveau compte" }}
      />
    ) : (
      <AdminEmptyState
        kind="noMatch"
        icon={<SearchIcon size={40} strokeWidth={1.6} />}
        title={ACCOUNT_MESSAGES.emptyNoMatchTitle}
        caption={caption}
        action={{ href: BASE_PATH, label: "Réinitialiser les filtres" }}
      />
    );
  }

  const isHighlighted = (account: Account) => highlight !== null && account.username === highlight;
  const columns: AdminColumn<Account>[] = [
    {
      id: "identifiant",
      header: "Identifiant",
      sortable: true,
      sticky: true,
      cell: (account) => <AccountUsernameCell username={account.username} highlighted={isHighlighted(account)} />,
    },
    { id: "joueur", header: "Joueur", sortable: true, cell: (account) => <AccountPlayerCell account={account} /> },
    { id: "equipe", header: "Équipe", sortable: true, cell: (account) => account.teamName ?? "—" },
    { id: "motdepasse", header: "Mot de passe", cell: (account) => <AccountPasswordStatus hasPassword={account.hasPassword} /> },
    { id: "remarques", header: "Remarques", cell: (account) => <AccountBadges account={account} /> },
  ];

  return (
    <AdminTable
      caption={caption}
      columns={columns}
      rows={visible}
      getRowKey={(account) => account.username}
      sort={query.sort}
      buildSortHref={(columnId) =>
        buildAdminListHref(BASE_PATH, { ...query, sort: toggleSort(query.sort, columnId), page: 1 }, ACCOUNT_LIST_SPEC)
      }
      rowActions={(account) => <AccountRowActions account={account} session={session} />}
      isRowHighlighted={isHighlighted}
      minWidth="lg"
    />
  );
}
