import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { animationDelay } from "@/lib/animationDelay";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { buildAdminHref } from "@/models/buildAdminHref";
import { describeAdminGameTarget } from "@/models/describeAdminGameTarget";
import { parseGameId } from "@/models/parseGameId";
import { getGameDetail } from "@/repositories/GameRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { GameFormBlock } from "@/views/admin-game/components/GameFormBlock";

type AdminGameEditViewProps = { rawId: string };

/**
 * Modification d'un match. Identifiant invalide ou match inconnu → « Match introuvable » ; lecture en échec → page
 * d'erreur : JAMAIS de formulaire vide ni soumettable (P5).
 */
export async function AdminGameEditView({ rawId }: AdminGameEditViewProps) {
  const session = await requireAdmin();
  const gameId = parseGameId(rawId) ?? notFound();
  const detail = (await getGameDetail(gameId)) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Modifier le match"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Matchs", href: buildAdminGameListHref(detail.seasonId) },
          { label: "Modifier" },
        ]}
        actions={
          <AdminRowAction
            href={buildAdminHref("game", { kind: "delete", id: gameId })}
            label="Supprimer"
            subject={describeAdminGameTarget(detail.game)}
            tone="danger"
            icon={<TrashIcon size={16} strokeWidth={2.4} />}
          />
        }
      />
      <div className="reveal flex flex-col items-start gap-5" style={animationDelay(80)}>
        <BlockErrorBoundary title="Formulaire du match" className="w-full max-w-[720px]">
          <Suspense fallback={<SkeletonCard lines={6} className="w-full max-w-[720px]" />}>
            <GameFormBlock mode="edit" token={session.token} detail={detail} />
          </Suspense>
        </BlockErrorBoundary>
      </div>
    </main>
  );
}
