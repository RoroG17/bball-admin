import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { formatAdminGameTitle } from "@/models/formatAdminGameTitle";
import { parseGameId } from "@/models/parseGameId";
import { getGameDetail } from "@/repositories/GameRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { GameDeletionBlock } from "@/views/admin-game/components/GameDeletionBlock";

type AdminGameDeleteViewProps = { rawId: string };

/** Page de confirmation d'une suppression : match nommé, impact chiffré, jamais de blocage applicatif (D-ADM-1). */
export async function AdminGameDeleteView({ rawId }: AdminGameDeleteViewProps) {
  await requireAdmin();
  const gameId = parseGameId(rawId) ?? notFound();
  const detail = (await getGameDetail(gameId)) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Supprimer le match"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Matchs", href: buildAdminGameListHref(detail.seasonId) },
          { label: "Supprimer" },
        ]}
      />
      <AdminConfirmPanel
        title="Supprimer ce match ?"
        subject={formatAdminGameTitle(detail.game)}
        warning={GAME_MESSAGES.deleteWarning}
      >
        <BlockErrorBoundary title="Données qui seront supprimées">
          <Suspense fallback={<AdminTableSkeleton rows={2} />}>
            <GameDeletionBlock gameId={gameId} seasonId={detail.seasonId} />
          </Suspense>
        </BlockErrorBoundary>
      </AdminConfirmPanel>
    </main>
  );
}
