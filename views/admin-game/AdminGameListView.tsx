import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { buildAdminGameCreateHref } from "@/models/buildAdminGameCreateHref";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { buildAdminHref } from "@/models/buildAdminHref";
import { parseAdminNotice } from "@/models/parseAdminNotice";
import { resolveGameListRequest } from "@/models/resolveGameListRequest";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { AdminGameNotice } from "@/views/admin-game/components/AdminGameNotice";
import { AdminGameTableBlock } from "@/views/admin-game/components/AdminGameTableBlock";
import { AdminGameToolbar } from "@/views/admin-game/components/AdminGameToolbar";

type AdminGameListViewProps = { rawQuery: RawSearchParams };

const BREADCRUMB_ROOT = [{ label: "Administration", href: "/admin" }];

/**
 * Liste des matchs d'une saison, pilotée par l'URL (saison, recherche, tri). La saison la plus récente est choisie par
 * défaut et l'URL est ramenée à sa forme canonique (D-G1).
 */
export async function AdminGameListView({ rawQuery }: AdminGameListViewProps) {
  const session = await requireAdmin();
  const seasons = await listAllSeasons(session.token);
  const { query, season, redirectTo } = resolveGameListRequest(rawQuery, seasons);
  if (redirectTo) redirect(redirectTo);

  if (season === null) {
    return (
      <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
        <AdminPageHeader title="Matchs" breadcrumb={[...BREADCRUMB_ROOT, { label: "Matchs" }]} />
        <AdminEmptyState
          kind="none"
          icon={<CalendarIcon size={40} strokeWidth={1.6} />}
          title={GAME_MESSAGES.noSeasonTitle}
          text={GAME_MESSAGES.noSeasonText}
          action={{ href: buildAdminHref("season", "create"), label: "Créer une saison" }}
        />
      </main>
    );
  }
  // Pas de pagination : une page au-delà de la première n'existe pas.
  if (query.page !== 1) redirect(buildAdminGameListHref(season.id, { ...query, page: 1 }));

  const notice = parseAdminNotice(rawQuery);
  const cleanHref = buildAdminGameListHref(season.id, query);

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Matchs"
        breadcrumb={[...BREADCRUMB_ROOT, { label: "Matchs" }]}
        actions={
          <PrimaryButton href={buildAdminGameCreateHref(season.id)}>
            <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
            Nouveau match
          </PrimaryButton>
        }
      />
      {notice && (
        <BlockErrorBoundary title="Message">
          <Suspense fallback={null}>
            <AdminGameNotice notice={notice} seasonId={season.id} cleanHref={cleanHref} />
          </Suspense>
        </BlockErrorBoundary>
      )}
      <AdminGameToolbar season={season} seasons={seasons} query={query} />
      <BlockErrorBoundary title="Matchs de la saison">
        <Suspense key={cleanHref} fallback={<AdminTableSkeleton />}>
          <AdminGameTableBlock season={season} query={query} highlight={notice} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
