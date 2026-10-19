import { createPlayer } from "@/actions/adminPlayerActions";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { animationDelay } from "@/lib/animationDelay";
import { buildMediaBaseUrl } from "@/lib/mediaUrl";
import { buildAdminHref } from "@/models/buildAdminHref";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import type { PlayerField } from "@/models/PlayerInput";
import { EMPTY_PLAYER_VALUES } from "@/models/toPlayerFormValues";
import { toTeamSelectOptions } from "@/models/toTeamSelectOptions";
import { requireAdmin } from "@/repositories/SessionRepository";
import { listTeams } from "@/repositories/TeamRepository";
import { AdminPlayerFormFields } from "@/views/admin-player/components/AdminPlayerFormFields";
import { AdminPlayerNoTeamState } from "@/views/admin-player/components/AdminPlayerNoTeamState";

/**
 * Formulaire de création d'un joueur. La liste des équipes est indispensable : lecture en échec → page d'erreur, jamais
 * un formulaire sans équipes. Aucune équipe → état dédié avec lien de création.
 */
export async function AdminPlayerCreateView() {
  const session = await requireAdmin();
  const teams = await listTeams(session.token);

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Nouveau joueur"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Joueurs", href: buildAdminHref("player") },
          { label: "Nouveau joueur" },
        ]}
      />
      {teams.length === 0 ? (
        <AdminPlayerNoTeamState />
      ) : (
        <div className="reveal flex flex-wrap items-start gap-5" style={animationDelay(80)}>
          <AdminForm<PlayerField>
            action={createPlayer}
            submitLabel="Créer le joueur"
            busyLabel="Création…"
            cancelHref={buildAdminHref("player")}
          >
            <AdminPlayerFormFields
              mode="create"
              defaults={EMPTY_PLAYER_VALUES}
              teamOptions={toTeamSelectOptions(teams)}
              photoBaseUrl={buildMediaBaseUrl("joueur")}
              today={getParisIsoDate(new Date())}
            />
          </AdminForm>
        </div>
      )}
    </main>
  );
}
