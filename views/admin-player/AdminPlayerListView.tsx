import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { PLAYER_LIST_SPEC } from "@/models/adminPlayerListSpec";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { describeAdminNotice } from "@/models/describeAdminNotice";
import { dropInvalidPlayerTeam } from "@/models/dropInvalidPlayerTeam";
import { parseAdminNotice } from "@/models/parseAdminNotice";
import { resolveAdminListQuery } from "@/models/resolveAdminListQuery";
import { requireAdmin } from "@/repositories/SessionRepository";
import { AdminPlayerListBlock } from "@/views/admin-player/components/AdminPlayerListBlock";

type AdminPlayerListViewProps = { rawQuery: RawSearchParams };

const BASE_PATH = buildAdminHref("player");

export async function AdminPlayerListView({ rawQuery }: AdminPlayerListViewProps) {
  await requireAdmin();

  const safeRaw = dropInvalidPlayerTeam(rawQuery);
  const { query, redirectTo } = resolveAdminListQuery(BASE_PATH, safeRaw, PLAYER_LIST_SPEC);
  if (redirectTo) redirect(redirectTo);
  if (safeRaw !== rawQuery) {
    // Un filtre invalide a été retiré : l'URL est ramenée à sa forme canonique, notice conservée (K8).
    const pending = parseAdminNotice(rawQuery);
    const canonical = buildAdminListHref(BASE_PATH, query, PLAYER_LIST_SPEC);
    redirect(pending ? appendAdminNotice(canonical, pending) : canonical);
  }
  // Pas de pagination (D-P10) : une page au-delà de la première n'existe pas.
  if (query.page !== 1) redirect(buildAdminListHref(BASE_PATH, { ...query, page: 1 }, PLAYER_LIST_SPEC));

  const notice = parseAdminNotice(rawQuery);
  const cleanHref = buildAdminListHref(BASE_PATH, query, PLAYER_LIST_SPEC);

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Joueurs"
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Joueurs" }]}
        actions={
          <PrimaryButton href={buildAdminHref("player", "create")}>
            <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
            Nouveau joueur
          </PrimaryButton>
        }
      />
      {notice && <AdminNotice message={describeAdminNotice(notice.code, "player", null)} cleanHref={cleanHref} />}
      <BlockErrorBoundary title="Liste des joueurs">
        <Suspense key={cleanHref} fallback={<AdminTableSkeleton />}>
          <AdminPlayerListBlock query={query} highlight={notice} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
