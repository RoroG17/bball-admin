import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { PlayIcon } from "@/components/ui/icons/PlayIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { buildAdminHref } from "@/models/buildAdminHref";
import { ADMIN_GAME_ACTION_LABELS, type AdminGameAction } from "@/models/AdminGameAction";

type AdminGameActionsProps = { gameId: number; actions: AdminGameAction[] };

/** Actions de l'admin. Édition et vidéo : écran d'administration des matchs (`buildAdminHref`). */
export function AdminGameActions({ gameId, actions }: AdminGameActionsProps) {
  return (
    <nav aria-label="Actions administrateur" className="flex flex-wrap gap-2.5">
      {actions.map((action) => {
        const label = ADMIN_GAME_ACTION_LABELS[action];
        if (action === "enterStats") {
          return (
            <PrimaryButton key={action} href={`/game/${gameId}/stat`}>
              {label}
              <ArrowRightIcon size={18} strokeWidth={2.5} className="btn-arrow shrink-0" />
            </PrimaryButton>
          );
        }
        const Icon = action === "editGame" ? PencilIcon : PlayIcon;
        return (
          <PrimaryButton key={action} variant="outline" href={buildAdminHref("game", { kind: "edit", id: gameId })}>
            <Icon size={18} className="shrink-0" />
            {label}
          </PrimaryButton>
        );
      })}
    </nav>
  );
}
