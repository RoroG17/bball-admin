import { useId } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { GameStatusBadge } from "@/components/ui/GameStatusBadge";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { VenueBadge } from "@/components/ui/VenueBadge";
import { animationDelay } from "@/lib/animationDelay";
import { capitalizeFirst, formatGameDate } from "@/lib/format";
import type { CalendarGame } from "@/models/CalendarGame";
import type { GameSide } from "@/models/GameOutcome";
import { describeCalendarGame } from "@/models/describeCalendarGame";
import { formatGameHeading } from "@/models/formatGameHeading";
import { ScoreboardTeam } from "@/views/game-detail/components/ScoreboardTeam";

type GameScoreboardProps = { overview: CalendarGame; seasonLabel: string };

const BADGE_DELAY_MS = 1100;

const sideClass = (side: GameSide, rpbSide: GameSide | null) => (side === rpbSide ? "text-rpb-gold" : undefined);

/** Affiche du match : titre, date, lieu et tableau de score. Aucun score pour un match à venir (P5). */
export function GameScoreboard({ overview, seasonLabel }: GameScoreboardProps) {
  const headingId = useId();
  const { game, status, rpbSide } = overview;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="reveal flex flex-col gap-1" style={animationDelay(60)}>
        <p className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">Saison {seasonLabel}</p>
        <h1
          id={headingId}
          className="font-display text-[28px] leading-[1.1] font-black wrap-anywhere @2xl:text-[40px] @2xl:leading-[1.05]"
        >
          {formatGameHeading(game)}
        </h1>
      </div>

      <div className="reveal flex flex-wrap items-center gap-2.5" style={animationDelay(100)}>
        <p className="flex items-center gap-2.5 rounded-md bg-rpb-gold-light px-3 py-2 text-sm font-semibold">
          <CalendarIcon size={18} className="shrink-0" />
          {capitalizeFirst(formatGameDate(game.date))}
        </p>
        <VenueBadge side={rpbSide} />
      </div>

      <div
        className="reveal @container rounded-lg border-2 border-rpb-ink bg-rpb-bordeaux px-5 py-6 text-rpb-cream shadow-score"
        style={animationDelay(140)}
      >
        <p className="sr-only">{describeCalendarGame(overview)}</p>
        <div
          aria-hidden="true"
          className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 @2xl:gap-x-8"
        >
          <ScoreboardTeam team={game.home} isRpb={rpbSide === "home"} />
          <div className="flex flex-col items-center gap-2.5">
            {status === "played" && (
              <>
                <p className="flex items-center gap-2 font-display text-[44px] leading-none font-black whitespace-nowrap tabular-nums @2xl:gap-3 @2xl:text-[64px]">
                  <span className={sideClass("home", rpbSide)}>
                    <CountUp value={game.home.score} kind="integer" />
                  </span>
                  <span>–</span>
                  <span className={sideClass("away", rpbSide)}>
                    <CountUp value={game.away.score} kind="integer" />
                  </span>
                </p>
                <p className="text-xs font-semibold tracking-[.08em] text-rpb-gold-light uppercase">Score final</p>
                <GameStatusBadge entry={overview} popDelayMs={BADGE_DELAY_MS} />
              </>
            )}
            {status === "upcoming" && (
              <>
                <BallIcon size={28} filled className="ball" />
                <span className="vs font-display text-[36px] leading-none font-black text-rpb-gold @2xl:text-[48px]">VS</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-rpb-gold px-2.5 py-1 text-[13px] font-bold whitespace-nowrap text-rpb-gold">
                  <CalendarIcon size={13} strokeWidth={2.5} />À venir
                </span>
              </>
            )}
            {status === "scoreMissing" && (
              <>
                <p className="inline-flex items-center gap-4 rounded-md border-2 border-dashed border-rpb-cream/22 px-4 py-2 font-display text-[44px] leading-none font-black @2xl:text-[64px]">
                  <span className={sideClass("home", rpbSide)}>–</span>
                  <span className={sideClass("away", rpbSide)}>–</span>
                </p>
                <GameStatusBadge entry={overview} popDelayMs={BADGE_DELAY_MS} />
              </>
            )}
          </div>
          <ScoreboardTeam team={game.away} isRpb={rpbSide === "away"} />
        </div>
      </div>
    </section>
  );
}
