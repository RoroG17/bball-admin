import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { parseAdminNotice } from "@/models/parseAdminNotice";
import { resolveAdminListQuery } from "@/models/resolveAdminListQuery";
import { SEASON_LIST_SPEC } from "@/models/seasonListSpec";
import { requireAdmin } from "@/repositories/SessionRepository";
import { SeasonNoticeBlock } from "@/views/admin-season/components/SeasonNoticeBlock";
import { SeasonTableBlock } from "@/views/admin-season/components/SeasonTableBlock";

type AdminSeasonListViewProps = { rawQuery: RawSearchParams };

const BASE_PATH = buildAdminHref("season");

/** Liste des saisons, de la plus récente à la plus ancienne, pilotée par l'URL (recherche et tri). */
export async function AdminSeasonListView({ rawQuery }: AdminSeasonListViewProps) {
  const session = await requireAdmin();

  const { query, redirectTo } = resolveAdminListQuery(BASE_PATH, rawQuery, SEASON_LIST_SPEC);
  if (redirectTo) redirect(redirectTo);
  // Pas de pagination : une page au-delà de la première n'existe pas.
  if (query.page !== 1) redirect(buildAdminListHref(BASE_PATH, { ...query, page: 1 }, SEASON_LIST_SPEC));

  const notice = parseAdminNotice(rawQuery);
  const cleanHref = buildAdminListHref(BASE_PATH, query, SEASON_LIST_SPEC);

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Saisons"
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Saisons" }]}
        actions={
          <PrimaryButton href={buildAdminHref("season", "create")}>
            <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
            Nouvelle saison
          </PrimaryButton>
        }
      />
      {notice && (
        <BlockErrorBoundary title="Message">
          <Suspense fallback={null}>
            <SeasonNoticeBlock notice={notice} cleanHref={cleanHref} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      )}
      <AdminListToolbar
        basePath={BASE_PATH}
        query={query}
        spec={SEASON_LIST_SPEC}
        searchLabel="Rechercher une saison"
        isFiltered={query.q !== ""}
      />
      <BlockErrorBoundary title="Liste des saisons">
        <Suspense key={cleanHref} fallback={<AdminTableSkeleton />}>
          <SeasonTableBlock query={query} token={session.token} highlight={notice} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
