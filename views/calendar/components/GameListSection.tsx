import { useId } from "react";
import { animationDelay } from "@/lib/animationDelay";
import { pluralize } from "@/lib/format";
import type { CalendarGame } from "@/models/CalendarGame";
import { CalendarGameRow } from "@/views/calendar/components/CalendarGameRow";

type GameListSectionProps = {
  title: "À venir" | "Résultats";
  entries: CalendarGame[];
  emptyText: string;
};

const TIMINGS = {
  "À venir": { headerMs: 280, rowsMs: 320, count: (n: number) => pluralize(n, "autre match", "autres matchs") },
  Résultats: { headerMs: 360, rowsMs: 400, count: (n: number) => pluralize(n, "match", "matchs") },
};

export function GameListSection({ title, entries, emptyText }: GameListSectionProps) {
  const titleId = useId();
  const { headerMs, rowsMs, count } = TIMINGS[title];

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3.5">
      <div
        className="reveal flex flex-wrap items-baseline justify-between gap-2 border-b-[3px] border-rpb-bordeaux pb-2"
        style={animationDelay(headerMs)}
      >
        <h2 id={titleId} className="font-display text-[26px] font-black">
          {title}
        </h2>
        {entries.length > 0 && <p className="text-[13px] text-rpb-ink/72 tabular-nums">{count(entries.length)}</p>}
      </div>
      {entries.length === 0 ? (
        <p
          className="reveal rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream px-5 py-4 text-sm text-rpb-ink/72 shadow-card"
          style={animationDelay(rowsMs)}
        >
          {emptyText}
        </p>
      ) : (
        <ol className="@container m-0 flex list-none flex-col divide-y divide-rpb-ink/12 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-1.5 shadow-card">
          {entries.map((entry, index) => (
            <CalendarGameRow key={entry.game.id} entry={entry} delayMs={rowsMs + Math.min(index, 8) * 40} />
          ))}
        </ol>
      )}
    </section>
  );
}
