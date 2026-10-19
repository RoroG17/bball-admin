import { createTeam } from "@/actions/teamActions";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { animationDelay } from "@/lib/animationDelay";
import { buildMediaBaseUrl } from "@/lib/mediaUrl";
import { buildAdminHref } from "@/models/buildAdminHref";
import type { TeamField } from "@/models/TeamInput";
import { requireAdmin } from "@/repositories/SessionRepository";
import { TeamFormFields } from "@/views/admin-team/components/TeamFormFields";

/** Formulaire de création d'une équipe. Aucune lecture de données. */
export async function AdminTeamCreateView() {
  await requireAdmin();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Nouvelle équipe"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Équipes", href: buildAdminHref("team") },
          { label: "Nouvelle équipe" },
        ]}
      />
      <div className="reveal flex flex-wrap items-start gap-5" style={animationDelay(80)}>
        <AdminForm<TeamField>
          action={createTeam}
          submitLabel="Créer l'équipe"
          busyLabel="Création…"
          cancelHref={buildAdminHref("team")}
        >
          <TeamFormFields defaults={{ name: "", logo: "" }} previewName="" logoBaseUrl={buildMediaBaseUrl("logo")} />
        </AdminForm>
      </div>
    </main>
  );
}
