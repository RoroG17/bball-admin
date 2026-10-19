import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SelectField } from "@/components/ui/SelectField";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { dropInvalidTeamType } from "@/models/dropInvalidTeamType";
import { parseAdminNotice } from "@/models/parseAdminNotice";
import { resolveAdminListQuery } from "@/models/resolveAdminListQuery";
import { TEAM_LIST_SPEC, TEAM_TYPE_LABELS, TEAM_TYPE_PLACEHOLDER, TEAM_TYPES } from "@/models/teamList";
import { requireAdmin } from "@/repositories/SessionRepository";
import { TeamNoticeBlock } from "@/views/admin-team/components/TeamNoticeBlock";
import { TeamTableBlock } from "@/views/admin-team/components/TeamTableBlock";

type AdminTeamListViewProps = { rawQuery: RawSearchParams };

const BASE_PATH = buildAdminHref("team");
const TYPE_OPTIONS = TEAM_TYPES.map((type) => ({ value: type, label: TEAM_TYPE_LABELS[type] }));

export async function AdminTeamListView({ rawQuery }: AdminTeamListViewProps) {
  const session = await requireAdmin();

  const safeRaw = dropInvalidTeamType(rawQuery);
  const { query, redirectTo } = resolveAdminListQuery(BASE_PATH, safeRaw, TEAM_LIST_SPEC);
  if (redirectTo) redirect(redirectTo);
  if (safeRaw !== rawQuery) {
    // Un filtre invalide (ou vide) a été retiré : l'URL est ramenée à sa forme canonique, notice conservée.
    const pending = parseAdminNotice(rawQuery);
    const canonical = buildAdminListHref(BASE_PATH, query, TEAM_LIST_SPEC);
    redirect(pending ? appendAdminNotice(canonical, pending) : canonical);
  }
  // Pas de pagination : une page au-delà de la première n'existe pas.
  if (query.page !== 1) redirect(buildAdminListHref(BASE_PATH, { ...query, page: 1 }, TEAM_LIST_SPEC));

  const notice = parseAdminNotice(rawQuery);
  const cleanHref = buildAdminListHref(BASE_PATH, query, TEAM_LIST_SPEC);
  const isFiltered = query.q !== "" || Boolean(query.filters.type);

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Équipes"
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Équipes" }]}
        actions={
          <PrimaryButton href={buildAdminHref("team", "create")}>
            <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
            Nouvelle équipe
          </PrimaryButton>
        }
      />
      {notice && (
        <BlockErrorBoundary title="Message">
          <Suspense fallback={null}>
            <TeamNoticeBlock notice={notice} cleanHref={cleanHref} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      )}
      <AdminListToolbar
        basePath={BASE_PATH}
        query={query}
        spec={TEAM_LIST_SPEC}
        searchLabel="Rechercher une équipe"
        isFiltered={isFiltered}
      >
        <SelectField
          name="type"
          label="Type"
          placeholder={TEAM_TYPE_PLACEHOLDER}
          options={TYPE_OPTIONS}
          defaultValue={query.filters.type}
        />
      </AdminListToolbar>
      <BlockErrorBoundary title="Liste des équipes">
        <Suspense key={cleanHref} fallback={<AdminTableSkeleton />}>
          <TeamTableBlock query={query} token={session.token} highlight={notice} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
