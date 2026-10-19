import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { buildAdminHref } from "@/models/buildAdminHref";
import { parseAccountUsername } from "@/models/parseAccountUsername";
import { requireAdmin } from "@/repositories/SessionRepository";
import { AccountResetBlock } from "@/views/admin-user/components/AccountResetBlock";

type AdminUserResetViewProps = { rawId: string };

/** Page de confirmation d'une réinitialisation. L'identifiant du segment passe par `parseAccountUsername` (seul décodage). */
export async function AdminUserResetView({ rawId }: AdminUserResetViewProps) {
  const session = await requireAdmin();
  const username = parseAccountUsername(rawId) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Réinitialiser le mot de passe"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Utilisateurs", href: buildAdminHref("user") },
          { label: "Réinitialiser" },
        ]}
      />
      <BlockErrorBoundary title="Confirmation">
        <Suspense fallback={<AdminTableSkeleton rows={3} />}>
          <AccountResetBlock username={username} session={session} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
