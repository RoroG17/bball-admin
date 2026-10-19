import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { buildAdminHref } from "@/models/buildAdminHref";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { getAdminPlayer } from "@/repositories/AdminPlayerRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { PlayerCreatedAccountBlock } from "@/views/admin-player/components/PlayerCreatedAccountBlock";
import { PlayerCreatedEnrollmentBlock } from "@/views/admin-player/components/PlayerCreatedEnrollmentBlock";
import { PlayerCreatedLinks } from "@/views/admin-player/components/PlayerCreatedLinks";
import { PlayerCreatedSummary } from "@/views/admin-player/components/PlayerCreatedSummary";

type AdminPlayerCreatedViewProps = { rawLicence: string };

/**
 * Page « joueur créé » (D-P1) : l'identifiant de connexion et la proposition d'inscription restent consultables (un
 * bandeau `?notice=` disparaîtrait). Se relit à volonté ; indépendante de la liste. Structure sans maquette (DD1).
 */
export async function AdminPlayerCreatedView({ rawLicence }: AdminPlayerCreatedViewProps) {
  const session = await requireAdmin();
  const licence = parsePlayerLicence(rawLicence) ?? notFound();
  const player = (await getAdminPlayer(licence)) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Joueur créé"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Joueurs", href: buildAdminHref("player") },
          { label: "Joueur créé" },
        ]}
      />
      <PlayerCreatedSummary player={player} />
      <div className="flex max-w-[720px] flex-col gap-5">
        <BlockErrorBoundary title="Identifiant de connexion">
          <Suspense fallback={<SkeletonCard lines={3} />}>
            <PlayerCreatedAccountBlock licence={licence} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
        <BlockErrorBoundary title="Inscription à la saison">
          <Suspense fallback={<SkeletonCard lines={3} />}>
            <PlayerCreatedEnrollmentBlock licence={licence} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      </div>
      <PlayerCreatedLinks licence={licence} />
    </main>
  );
}
