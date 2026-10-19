import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { buildAdminHref } from "@/models/buildAdminHref";
import { parseTeamId } from "@/models/parseTeamId";
import { TEAM_MESSAGES } from "@/models/teamMessages";
import { requireAdmin } from "@/repositories/SessionRepository";
import { getTeam } from "@/repositories/TeamRepository";
import { TeamDeletionBlock } from "@/views/admin-team/components/TeamDeletionBlock";

type AdminTeamDeleteViewProps = { rawId: string };

/** Page de confirmation d'une suppression : impact chiffré, jamais de blocage applicatif (D-ADM-1). */
export async function AdminTeamDeleteView({ rawId }: AdminTeamDeleteViewProps) {
  const session = await requireAdmin();
  const id = parseTeamId(rawId) ?? notFound();
  const team = (await getTeam(id, session.token)) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Supprimer l'équipe"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Équipes", href: buildAdminHref("team") },
          { label: "Supprimer" },
        ]}
      />
      <AdminConfirmPanel
        title={`Supprimer « ${team.name} » ?`}
        subject={team.logoFile ?? "Aucun logo"}
        warning={TEAM_MESSAGES.deleteWarning}
        leading={<TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb={false} context="list" decorative />}
      >
        <BlockErrorBoundary title="Données qui seront supprimées">
          <Suspense fallback={<AdminTableSkeleton rows={3} />}>
            <TeamDeletionBlock team={team} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      </AdminConfirmPanel>
    </main>
  );
}
