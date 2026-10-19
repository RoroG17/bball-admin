import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { buildAdminHref } from "@/models/buildAdminHref";
import type { Team } from "@/models/Team";

type TeamRowActionsProps = { team: Team };

/** « Modifier Colomiers » et « Supprimer Colomiers » : le nom accessible contient l'équipe. */
export function TeamRowActions({ team }: TeamRowActionsProps) {
  return (
    <>
      <AdminRowAction
        href={buildAdminHref("team", { kind: "edit", id: team.id })}
        label="Modifier"
        subject={team.name}
        icon={<PencilIcon size={16} strokeWidth={2.4} />}
      />
      <AdminRowAction
        href={buildAdminHref("team", { kind: "delete", id: team.id })}
        label="Supprimer"
        subject={team.name}
        tone="danger"
        icon={<TrashIcon size={16} strokeWidth={2.4} />}
      />
    </>
  );
}
