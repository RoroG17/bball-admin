import { GroupIcon } from "@/components/ui/icons/GroupIcon";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { buildAdminHref } from "@/models/buildAdminHref";

/** Aucune équipe : impossible de rattacher un joueur, le formulaire n'est pas proposé. */
export function AdminPlayerNoTeamState() {
  return (
    <section className="reveal flex flex-col items-center gap-4 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream px-5 py-6 shadow-card">
      <EmptyState
        icon={<GroupIcon size={40} strokeWidth={1.6} />}
        title={ADMIN_PLAYER_MESSAGES.noTeamTitle}
        text={ADMIN_PLAYER_MESSAGES.noTeamText}
      />
      <PrimaryButton href={buildAdminHref("team", "create")}>
        <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
        Créer une équipe
      </PrimaryButton>
    </section>
  );
}
