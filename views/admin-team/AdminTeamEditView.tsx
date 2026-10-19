import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateTeam } from "@/actions/teamActions";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { animationDelay } from "@/lib/animationDelay";
import { buildMediaBaseUrl } from "@/lib/mediaUrl";
import { buildAdminHref } from "@/models/buildAdminHref";
import { parseTeamId } from "@/models/parseTeamId";
import type { TeamField } from "@/models/TeamInput";
import { requireAdmin } from "@/repositories/SessionRepository";
import { getTeam } from "@/repositories/TeamRepository";
import { TeamFormFields } from "@/views/admin-team/components/TeamFormFields";
import { TeamUsageBlock } from "@/views/admin-team/components/TeamUsageBlock";

type AdminTeamEditViewProps = { rawId: string };

/**
 * Formulaire de modification. Équipe introuvable → « Équipe introuvable » ; lecture en échec → page d'erreur : JAMAIS
 * de formulaire vide (P5).
 */
export async function AdminTeamEditView({ rawId }: AdminTeamEditViewProps) {
  const session = await requireAdmin();
  const id = parseTeamId(rawId) ?? notFound();
  const team = (await getTeam(id, session.token)) ?? notFound();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Modifier l'équipe"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Équipes", href: buildAdminHref("team") },
          { label: "Modifier" },
        ]}
        actions={
          <AdminRowAction
            href={buildAdminHref("team", { kind: "delete", id: team.id })}
            label="Supprimer"
            subject={team.name}
            tone="danger"
            icon={<TrashIcon size={16} strokeWidth={2.4} />}
          />
        }
      />
      <div className="reveal flex flex-wrap items-start gap-5" style={animationDelay(80)}>
        <AdminForm<TeamField>
          action={updateTeam}
          submitLabel="Enregistrer"
          busyLabel="Enregistrement…"
          cancelHref={buildAdminHref("team")}
        >
          <input type="hidden" name="id" value={team.id} />
          <TeamFormFields
            defaults={{ name: team.name, logo: team.logoFile ?? "" }}
            previewName={team.name}
            logoBaseUrl={buildMediaBaseUrl("logo")}
          />
        </AdminForm>
        <BlockErrorBoundary title="Utilisation de cette équipe" className="max-w-[420px] flex-[1_1_280px]">
          <Suspense fallback={<SkeletonCard lines={4} className="max-w-[420px] flex-[1_1_280px]" />}>
            <TeamUsageBlock team={team} token={session.token} />
          </Suspense>
        </BlockErrorBoundary>
      </div>
    </main>
  );
}
