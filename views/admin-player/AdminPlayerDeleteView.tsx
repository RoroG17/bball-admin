import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { buildAdminHref } from "@/models/buildAdminHref";
import { formatPlayerName } from "@/models/formatPlayerName";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { getPlayerProfile } from "@/repositories/PlayerRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { PlayerDeletionBlock } from "@/views/admin-player/components/PlayerDeletionBlock";

type AdminPlayerDeleteViewProps = { rawLicence: string };

/** Page de confirmation d'une suppression : impact chiffré, jamais de blocage applicatif (D-ADM-1). */
export async function AdminPlayerDeleteView({ rawLicence }: AdminPlayerDeleteViewProps) {
  const session = await requireAdmin();
  const licence = parsePlayerLicence(rawLicence) ?? notFound();
  const profile = (await getPlayerProfile(licence, { includePersonalInfo: false })) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Supprimer le joueur"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Joueurs", href: buildAdminHref("player") },
          { label: "Supprimer" },
        ]}
      />
      <AdminConfirmPanel
        title={`Supprimer ${formatPlayerName(profile.player)} ?`}
        subject={`Licence ${licence} · ${profile.team.name}`}
        warning={ADMIN_PLAYER_MESSAGES.deleteWarning}
        leading={<PlayerAvatar player={profile.player} size="lg" decorative />}
      >
        <BlockErrorBoundary title="Données qui seront supprimées">
          <Suspense fallback={<AdminTableSkeleton rows={3} />}>
            <PlayerDeletionBlock licence={licence} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      </AdminConfirmPanel>
    </main>
  );
}
