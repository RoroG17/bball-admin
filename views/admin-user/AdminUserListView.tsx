import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SelectField } from "@/components/ui/SelectField";
import {
  ACCOUNT_LIST_SPEC,
  ACCOUNT_STATUS_FILTERS,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_PLACEHOLDER,
} from "@/models/AccountListSpec";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { dropInvalidAccountStatus } from "@/models/dropInvalidAccountStatus";
import { parseAccountFilters } from "@/models/parseAccountFilters";
import { parseAdminNotice } from "@/models/parseAdminNotice";
import { resolveAdminListQuery } from "@/models/resolveAdminListQuery";
import { requireAdmin } from "@/repositories/SessionRepository";
import { AccountNoticeBlock } from "@/views/admin-user/components/AccountNoticeBlock";
import { AccountTableBlock } from "@/views/admin-user/components/AccountTableBlock";

type AdminUserListViewProps = { rawQuery: RawSearchParams };

const BASE_PATH = buildAdminHref("user");
const STATUS_OPTIONS = ACCOUNT_STATUS_FILTERS.map((status) => ({ value: status, label: ACCOUNT_STATUS_LABELS[status] }));

export async function AdminUserListView({ rawQuery }: AdminUserListViewProps) {
  const session = await requireAdmin();

  const safeRaw = dropInvalidAccountStatus(rawQuery);
  const { query, redirectTo } = resolveAdminListQuery(BASE_PATH, safeRaw, ACCOUNT_LIST_SPEC);
  if (redirectTo) redirect(redirectTo);
  if (safeRaw !== rawQuery) {
    // Un filtre invalide a été retiré : l'URL est ramenée à sa forme canonique, notice conservée.
    const pending = parseAdminNotice(rawQuery);
    const canonical = buildAdminListHref(BASE_PATH, query, ACCOUNT_LIST_SPEC);
    redirect(pending ? appendAdminNotice(canonical, pending) : canonical);
  }
  // Pas de pagination : une page au-delà de la première n'existe pas.
  if (query.page !== 1) redirect(buildAdminListHref(BASE_PATH, { ...query, page: 1 }, ACCOUNT_LIST_SPEC));

  const { status } = parseAccountFilters(query.filters);
  const notice = parseAdminNotice(rawQuery);
  const cleanHref = buildAdminListHref(BASE_PATH, query, ACCOUNT_LIST_SPEC);
  const isFiltered = query.q !== "" || status !== null;

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Utilisateurs"
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Utilisateurs" }]}
        actions={
          <PrimaryButton href={buildAdminHref("user", "create")}>
            <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
            Nouveau compte
          </PrimaryButton>
        }
      />
      {notice && (
        <BlockErrorBoundary title="Message">
          <Suspense fallback={null}>
            <AccountNoticeBlock notice={notice} cleanHref={cleanHref} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      )}
      <AdminListToolbar
        basePath={BASE_PATH}
        query={query}
        spec={ACCOUNT_LIST_SPEC}
        searchLabel="Rechercher un compte"
        isFiltered={isFiltered}
      >
        <SelectField
          name="statut"
          label="Afficher"
          placeholder={ACCOUNT_STATUS_PLACEHOLDER}
          options={STATUS_OPTIONS}
          defaultValue={status ?? ""}
        />
      </AdminListToolbar>
      <BlockErrorBoundary title="Liste des comptes">
        <Suspense key={cleanHref} fallback={<AdminTableSkeleton />}>
          <AccountTableBlock
            query={query}
            status={status}
            session={session}
            highlight={notice?.code === "created" ? notice.ref : null}
          />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
