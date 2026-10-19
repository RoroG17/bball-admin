import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { buildAdminHref } from "@/models/buildAdminHref";
import { parseAccountUsername } from "@/models/parseAccountUsername";
import { requireAdmin } from "@/repositories/SessionRepository";
import { AccountDeleteBlock } from "@/views/admin-user/components/AccountDeleteBlock";

type AdminUserDeleteViewProps = { rawId: string };

/** Page de confirmation d'une suppression de compte. L'identifiant du segment passe par `parseAccountUsername`. */
export async function AdminUserDeleteView({ rawId }: AdminUserDeleteViewProps) {
  const session = await requireAdmin();
  const username = parseAccountUsername(rawId) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Supprimer un compte"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Utilisateurs", href: buildAdminHref("user") },
          { label: "Supprimer" },
        ]}
      />
      <BlockErrorBoundary title="Confirmation">
        <Suspense fallback={<AdminTableSkeleton rows={3} />}>
          <AccountDeleteBlock username={username} session={session} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
