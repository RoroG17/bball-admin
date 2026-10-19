import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { animationDelay } from "@/lib/animationDelay";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { buildAdminHref } from "@/models/buildAdminHref";
import { requireAdmin } from "@/repositories/SessionRepository";
import { GameFormBlock } from "@/views/admin-game/components/GameFormBlock";

type AdminGameCreateViewProps = { rawQuery: RawSearchParams };

/** Formulaire de création d'un match ; la saison de la liste d'origine (`?saison=`) est présélectionnée. */
export async function AdminGameCreateView({ rawQuery }: AdminGameCreateViewProps) {
  const session = await requireAdmin();
  const requested = Array.isArray(rawQuery.saison) ? rawQuery.saison[0] : rawQuery.saison;

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Nouveau match"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Matchs", href: buildAdminHref("game") },
          { label: "Nouveau match" },
        ]}
      />
      <div className="reveal flex flex-wrap items-start gap-5" style={animationDelay(80)}>
        <BlockErrorBoundary title="Formulaire du match" className="w-full max-w-[720px]">
          <Suspense fallback={<SkeletonCard lines={6} className="w-full max-w-[720px]" />}>
            <GameFormBlock mode="create" token={session.token} requestedSeason={requested} />
          </Suspense>
        </BlockErrorBoundary>
      </div>
    </main>
  );
}
