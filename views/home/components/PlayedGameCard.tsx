import Link from "next/link";
import { animationDelay } from "@/lib/animationDelay";
import { formatGameDate } from "@/lib/format";
import type { Game } from "@/models/Game";
import type { GameOutcome, GameSide } from "@/models/GameOutcome";
import { describePlayedGame } from "@/models/describePlayedGame";
import { GameOutcomeBadge } from "@/components/ui/GameOutcomeBadge";
import { GameTeamLine } from "@/views/home/components/GameTeamLine";

type PlayedGameCardProps = {
  game: Game;
  outcome: GameOutcome;
  rpbSide: GameSide | null;
  isToday: boolean;
};

/** Tableau de score du dernier match : fond bordeaux, score du RPB en or, bordure encre. */
export function PlayedGameCard({ game, outcome, rpbSide, isToday }: PlayedGameCardProps) {
  const scoreEntered = outcome !== "notEntered";

  return (
    <Link
      href={`/game/${game.id}`}
      aria-label={describePlayedGame(game, outcome, isToday)}
      className="reveal lift flex min-w-0 flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-bordeaux p-5 text-rpb-cream no-underline shadow-score focus-ring"
      style={animationDelay(160)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-[.08em] text-rpb-gold-light uppercase">
          {isToday ? "Aujourd'hui" : "Dernier match"}
        </p>
        <GameOutcomeBadge outcome={outcome} popDelayMs={1100} />
      </div>
      <div className="flex flex-col gap-2.5">
        <GameTeamLine team={game.home} isRpb={rpbSide === "home"} sideLabel="domicile" scoreEntered={scoreEntered} />
        <div className="h-px bg-rpb-cream/22" />
        <GameTeamLine team={game.away} isRpb={rpbSide === "away"} sideLabel="extérieur" scoreEntered={scoreEntered} />
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-[13px]">
        <span>
          Match n°{game.number} · {formatGameDate(game.date)}
        </span>
        <span className="font-bold whitespace-nowrap text-rpb-gold">Fiche du match →</span>
      </div>
    </Link>
  );
}
