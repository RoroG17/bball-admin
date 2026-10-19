import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { VenueBadge } from "@/components/ui/VenueBadge";
import { animationDelay } from "@/lib/animationDelay";
import { capitalizeFirst, formatGameDateShort } from "@/lib/format";
import { cx } from "@/lib/cx";
import type { CalendarGame } from "@/models/CalendarGame";
import { describeCalendarGame } from "@/models/describeCalendarGame";
import { GameScore } from "@/views/calendar/components/GameScore";
import { GameStatusBadge } from "@/components/ui/GameStatusBadge";

type CalendarGameRowProps = {
  entry: CalendarGame;
  delayMs: number;
};

const TEAM_NAME = "line-clamp-2 wrap-anywhere text-sm @md:text-[15px]/[22px]";

/** Ligne de match : toute la ligne est un lien, nommé par `describeCalendarGame` (contenu visuel masqué). */
export function CalendarGameRow({ entry, delayMs }: CalendarGameRowProps) {
  const { game, status, rpbSide } = entry;

  return (
    <li className="row-in" style={animationDelay(delayMs)}>
      <Link
        href={`/game/${game.id}`}
        aria-label={describeCalendarGame(entry)}
        className="grid min-h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 rounded-md px-3.5 py-3 text-rpb-ink no-underline transition-colors hover:bg-rpb-gold-light focus-ring focus-visible:relative focus-visible:z-10 @2xl:grid-cols-[160px_minmax(0,1fr)_140px_16px] @2xl:gap-x-5"
      >
        <div aria-hidden="true" className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold">{capitalizeFirst(formatGameDateShort(game.date))}</span>
          <span className="text-xs text-rpb-ink/72 tabular-nums">Journée {game.number}</span>
        </div>

        <div
          aria-hidden="true"
          className="col-span-2 row-start-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 @2xl:col-span-1 @2xl:col-start-2 @2xl:row-start-1"
        >
          <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
            <span className={cx(TEAM_NAME, rpbSide === "home" ? "font-bold" : "font-medium")}>{game.home.name}</span>
            <TeamLogo name={game.home.name} logoUrl={game.home.logoUrl} isRpb={rpbSide === "home"} context="row" decorative />
          </div>
          <div className="flex min-w-[88px] flex-col items-center gap-1">
            {status === "played" && <GameScore home={game.home.score} away={game.away.score} rpbSide={rpbSide} />}
            {status === "upcoming" && <span className="font-display text-base font-black text-rpb-bordeaux">VS</span>}
            {status === "scoreMissing" && (
              <span className="inline-flex items-center gap-3 rounded-md border-2 border-dashed border-rpb-ink/30 px-2.5 py-1.5 font-display text-xl leading-none font-black text-rpb-ink/72">
                <span>–</span>
                <span>–</span>
              </span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamLogo name={game.away.name} logoUrl={game.away.logoUrl} isRpb={rpbSide === "away"} context="row" decorative />
            <span className={cx(TEAM_NAME, rpbSide === "away" ? "font-bold" : "font-medium")}>{game.away.name}</span>
          </div>
        </div>

        <div aria-hidden="true" className="col-start-2 row-start-1 flex flex-col items-end gap-1.5 @2xl:col-start-3">
          <GameStatusBadge entry={entry} />
          <VenueBadge side={rpbSide} variant="label" />
        </div>

        <ChevronRightIcon size={16} strokeWidth={2.5} className="chev hidden text-rpb-bordeaux @2xl:col-start-4 @2xl:block" />
      </Link>
    </li>
  );
}
