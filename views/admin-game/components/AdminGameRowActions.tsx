import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { EyeIcon } from "@/components/ui/icons/EyeIcon";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { PlayIcon } from "@/components/ui/icons/PlayIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import type { AdminGameRow } from "@/models/AdminGameRow";
import { buildAdminHref } from "@/models/buildAdminHref";
import { describeAdminGameTarget } from "@/models/describeAdminGameTarget";
import { getAdminGameRowActions } from "@/models/getAdminGameRowActions";

type AdminGameRowActionsProps = { row: AdminGameRow };

/** La saisie live n'a pas de route V2 : « Saisir les stats » reste masqué (D-G8). */
const ENTER_STATS_AVAILABLE = false;

/** « Voir le match de la journée 5, … » : le nom accessible de chaque action contient le match. */
export function AdminGameRowActions({ row }: AdminGameRowActionsProps) {
  const { game } = row.entry;
  const subject = describeAdminGameTarget(game);
  return (
    <>
      {getAdminGameRowActions(row, { enterStatsAvailable: ENTER_STATS_AVAILABLE }).map((action) => {
        switch (action) {
          case "view":
            return (
              <AdminRowAction
                key={action}
                href={`/game/${game.id}`}
                label="Voir"
                subject={subject}
                icon={<EyeIcon size={16} strokeWidth={2.4} />}
              />
            );
          case "edit":
            return (
              <AdminRowAction
                key={action}
                href={buildAdminHref("game", { kind: "edit", id: game.id })}
                label="Modifier"
                subject={subject}
                icon={<PencilIcon size={16} strokeWidth={2.4} />}
              />
            );
          case "enterStats":
            return (
              <AdminRowAction
                key={action}
                href={`/game/${game.id}/stat`}
                label="Saisir les stats"
                subject={subject}
                icon={<PlayIcon size={16} strokeWidth={2.4} />}
              />
            );
          case "delete":
            return (
              <AdminRowAction
                key={action}
                href={buildAdminHref("game", { kind: "delete", id: game.id })}
                label="Supprimer"
                subject={subject}
                tone="danger"
                icon={<TrashIcon size={16} strokeWidth={2.4} />}
              />
            );
        }
      })}
    </>
  );
}
