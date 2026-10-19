import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { buildAdminHref } from "@/models/buildAdminHref";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { Player } from "@/models/Player";

type AdminPlayerRowActionsProps = { player: Player };

/** « Modifier Paul Durand » et « Supprimer Paul Durand » : le nom accessible contient le joueur. */
export function AdminPlayerRowActions({ player }: AdminPlayerRowActionsProps) {
  const subject = formatPlayerName(player);
  return (
    <>
      <AdminRowAction
        href={buildAdminHref("player", { kind: "edit", id: player.licence })}
        label="Modifier"
        subject={subject}
        icon={<PencilIcon size={16} strokeWidth={2.4} />}
      />
      <AdminRowAction
        href={buildAdminHref("player", { kind: "delete", id: player.licence })}
        label="Supprimer"
        subject={subject}
        tone="danger"
        icon={<TrashIcon size={16} strokeWidth={2.4} />}
      />
    </>
  );
}
