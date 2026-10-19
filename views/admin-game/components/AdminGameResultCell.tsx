import { GameStatusBadge } from "@/components/ui/GameStatusBadge";
import type { CalendarGame } from "@/models/CalendarGame";

type AdminGameResultCellProps = { entry: CalendarGame };

/** Score et résultat (match joué), « Score à saisir » (date passée, 0-0) ou « À venir ». */
export function AdminGameResultCell({ entry }: AdminGameResultCellProps) {
  if (entry.status === "upcoming") return <span className="font-semibold">À venir</span>;
  if (entry.status === "scoreMissing") return <GameStatusBadge entry={entry} />;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-bold tabular-nums">
        {entry.game.home.score} – {entry.game.away.score}
      </span>
      <GameStatusBadge entry={entry} />
    </span>
  );
}
