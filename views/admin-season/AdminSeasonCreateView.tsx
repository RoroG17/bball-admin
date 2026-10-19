import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { animationDelay } from "@/lib/animationDelay";
import { buildAdminHref } from "@/models/buildAdminHref";
import { requireAdmin } from "@/repositories/SessionRepository";
import { SeasonFormBlock } from "@/views/admin-season/components/SeasonFormBlock";

/** Formulaire de création d'une saison (années proposées selon la date du jour, D-S6). */
export async function AdminSeasonCreateView() {
  const session = await requireAdmin();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Nouvelle saison"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Saisons", href: buildAdminHref("season") },
          { label: "Nouvelle saison" },
        ]}
      />
      <div className="reveal flex flex-wrap items-start gap-5" style={animationDelay(80)}>
        <BlockErrorBoundary title="Formulaire de la saison" className="w-full max-w-[720px]">
          <Suspense fallback={<SkeletonCard lines={5} className="w-full max-w-[720px]" />}>
            <SeasonFormBlock mode="create" token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      </div>
    </main>
  );
}
