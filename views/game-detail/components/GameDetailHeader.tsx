import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import type { AdminGameAction } from "@/models/AdminGameAction";
import { AdminGameActions } from "@/views/game-detail/components/AdminGameActions";

type GameDetailHeaderProps = {
  gameId: number;
  seasonId: number;
  /** Vide pour un joueur. */
  actions: AdminGameAction[];
};

export function GameDetailHeader({ gameId, seasonId, actions }: GameDetailHeaderProps) {
  return (
    <div className="reveal flex flex-wrap items-center justify-between gap-3">
      <Link
        href={`/game?saison=${seasonId}`}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md pr-2 text-[15px] font-semibold text-rpb-bordeaux no-underline focus-ring hover:underline hover:underline-offset-4"
      >
        <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
        Retour au calendrier
      </Link>
      {actions.length > 0 && <AdminGameActions gameId={gameId} actions={actions} />}
    </div>
  );
}
