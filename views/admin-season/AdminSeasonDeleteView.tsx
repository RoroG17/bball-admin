import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { buildAdminHref } from "@/models/buildAdminHref";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { parseSeasonId } from "@/models/parseSeasonId";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import { getSeasonById } from "@/repositories/SeasonRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { readOrNull } from "@/repositories/support/readOrNull";
import { listTeams } from "@/repositories/TeamRepository";
import { SeasonDeletionBlock } from "@/views/admin-season/components/SeasonDeletionBlock";

type AdminSeasonDeleteViewProps = { rawId: string };

/** Page de confirmation d'une suppression : impact chiffré, jamais de blocage applicatif (D-ADM-1). */
export async function AdminSeasonDeleteView({ rawId }: AdminSeasonDeleteViewProps) {
  const session = await requireAdmin();
  const seasonId = parseSeasonId(rawId) ?? notFound();
  const season = (await getSeasonById(seasonId, session.token)) ?? notFound();
  // Le nom de l'équipe n'est qu'un repère : une lecture en échec l'omet.
  const teams = await readOrNull(() => listTeams(session.token));
  const teamName = teams?.find((team) => team.id === season.teamId)?.name;

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Supprimer la saison"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Saisons", href: buildAdminHref("season") },
          { label: "Supprimer" },
        ]}
      />
      <AdminConfirmPanel
        title={`Supprimer la saison ${formatSeasonLabel(season)} ?`}
        subject={teamName ? `Équipe RPB : ${teamName}` : undefined}
        warning={SEASON_MESSAGES.deleteWarning}
      >
        <BlockErrorBoundary title="Données qui seront supprimées">
          <Suspense fallback={<AdminTableSkeleton rows={3} />}>
            <SeasonDeletionBlock seasonId={seasonId} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      </AdminConfirmPanel>
    </main>
  );
}
