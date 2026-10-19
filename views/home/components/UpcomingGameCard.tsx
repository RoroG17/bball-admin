import Link from "next/link";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { animationDelay } from "@/lib/animationDelay";
import { capitalizeFirst, formatGameDate } from "@/lib/format";
import { describeUpcomingGame } from "@/models/describeUpcomingGame";
import type { Game } from "@/models/Game";
import type { GameSide } from "@/models/GameOutcome";
import { MatchupTeam } from "@/components/ui/MatchupTeam";

type UpcomingGameCardProps = {
  game: Game;
  rpbSide: GameSide | null;
};

/** Carte du prochain match. Jamais de score : le back renvoie 0-0 pour un match non joué. */
export function UpcomingGameCard({ game, rpbSide }: UpcomingGameCardProps) {
  return (
    <Link
      href={`/game/${game.id}`}
      aria-label={describeUpcomingGame(game, rpbSide)}
      className="reveal lift flex min-w-0 flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-5 text-rpb-ink no-underline shadow-card focus-ring"
      style={animationDelay(240)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">Prochain match</p>
        {rpbSide === "home" && (
          <span className="rounded-full bg-rpb-red px-2.5 py-1 text-xs font-bold text-rpb-cream">À domicile</span>
        )}
        {rpbSide === "away" && (
          <span className="rounded-full bg-rpb-ink px-2.5 py-1 text-xs font-bold text-rpb-cream">À l&apos;extérieur</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2.5">
        <MatchupTeam team={game.home} isRpb={rpbSide === "home"} />
        <div className="flex flex-col items-center gap-1.5">
          <BallIcon size={22} filled className="ball" />
          <span className="vs font-display text-[22px] font-black text-rpb-bordeaux">VS</span>
        </div>
        <MatchupTeam team={game.away} isRpb={rpbSide === "away"} />
      </div>
      <div className="mt-auto flex items-center gap-2.5 rounded-md bg-rpb-gold-light px-3 py-2.5">
        <CalendarIcon size={18} className="shrink-0 text-rpb-ink" />
        <span className="text-sm font-semibold">{capitalizeFirst(formatGameDate(game.date))}</span>
        <span className="ml-auto text-[13px] whitespace-nowrap text-rpb-ink/72">Match n°{game.number}</span>
      </div>
    </Link>
  );
}
