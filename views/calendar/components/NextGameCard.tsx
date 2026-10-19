import Link from "next/link";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { MatchupTeam } from "@/components/ui/MatchupTeam";
import { VenueBadge } from "@/components/ui/VenueBadge";
import { animationDelay } from "@/lib/animationDelay";
import { capitalizeFirst, formatGameDate } from "@/lib/format";
import type { CalendarGame } from "@/models/CalendarGame";
import { countDaysUntil } from "@/models/countDaysUntil";
import { describeCalendarGame } from "@/models/describeCalendarGame";
import { describeDaysUntil } from "@/models/describeDaysUntil";

type NextGameCardProps = {
  entry: CalendarGame;
  today: string;
};

/** Prochain match mis en avant. Jamais de score : un match non joué vaut 0-0 côté back. */
export function NextGameCard({ entry, today }: NextGameCardProps) {
  const { game, rpbSide } = entry;
  const countdown = describeDaysUntil(countDaysUntil(game.date, today));

  return (
    <Link
      id="prochain-match"
      href={`/game/${game.id}`}
      aria-label={`Prochain match, ${countdown.toLocaleLowerCase("fr-FR")} : ${describeCalendarGame(entry)}`}
      className="reveal lift flex min-w-0 scroll-mt-6 flex-wrap items-center gap-x-8 gap-y-5 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-5 text-rpb-ink no-underline shadow-card focus-ring"
      style={animationDelay(200)}
    >
      <div aria-hidden="true" className="flex min-w-0 flex-[1_1_240px] flex-col items-start gap-2.5">
        <p className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">Prochain match</p>
        <p className="pop font-display text-[30px] leading-none font-black text-rpb-bordeaux" style={animationDelay(700)}>
          {countdown}
        </p>
        <p className="flex items-center gap-2.5 rounded-md bg-rpb-gold-light px-3 py-2 text-sm font-semibold">
          <CalendarIcon size={18} className="shrink-0 text-rpb-ink" />
          {capitalizeFirst(formatGameDate(game.date))}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[13px] text-rpb-ink/72 tabular-nums">Journée {game.number}</span>
          <VenueBadge side={rpbSide} variant="pill" />
        </div>
      </div>
      <div aria-hidden="true" className="flex min-w-0 flex-[2_1_380px] items-center justify-center gap-4">
        <MatchupTeam team={game.home} isRpb={rpbSide === "home"} decorative />
        <div className="flex flex-col items-center gap-1.5">
          <BallIcon size={22} filled className="ball" />
          <span className="vs font-display text-[22px] font-black text-rpb-bordeaux">VS</span>
        </div>
        <MatchupTeam team={game.away} isRpb={rpbSide === "away"} decorative />
      </div>
    </Link>
  );
}
