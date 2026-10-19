import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { buildAdminHref } from "@/models/buildAdminHref";
import { resolveAccountCreateRequest } from "@/models/resolveAccountCreateRequest";
import { requireAdmin } from "@/repositories/SessionRepository";
import { AccountCreateBlock } from "@/views/admin-user/components/AccountCreateBlock";

type AdminUserCreateViewProps = { rawQuery: RawSearchParams };

/** Création manuelle d'un compte : joueur facultatif choisi par l'URL (`?q=&joueur=`), forme canonique imposée. */
export async function AdminUserCreateView({ rawQuery }: AdminUserCreateViewProps) {
  const session = await requireAdmin();
  const { params, redirectTo } = resolveAccountCreateRequest(rawQuery);
  if (redirectTo) redirect(redirectTo);

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Nouveau compte"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Utilisateurs", href: buildAdminHref("user") },
          { label: "Nouveau compte" },
        ]}
      />
      <BlockErrorBoundary title="Création d'un compte">
        <Suspense fallback={<AdminTableSkeleton rows={4} />}>
          <AccountCreateBlock q={params.q} licence={params.licence} token={session.token} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
