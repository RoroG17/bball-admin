import { CountUp } from "@/components/ui/CountUp";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { cx } from "@/lib/cx";
import type { CalendarGame } from "@/models/CalendarGame";
import type { GameSide } from "@/models/GameOutcome";
import type { GameTeam } from "@/models/GameTeam";

type LastGameScoreboardRowProps = { team: GameTeam; side: GameSide; overview: CalendarGame };

export function LastGameScoreboardRow({ team, side, overview }: LastGameScoreboardRowProps) {
  const isRpb = overview.rpbSide === side;
  const score =
    overview.status === "scoreMissing" ? (
      "–"
    ) : overview.status === "played" ? (
      <CountUp value={team.score} kind="integer" />
    ) : null;

  return (
    <div className="flex items-center gap-3">
      <TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb={isRpb} context="scoreboard" decorative />
      <span className={cx("line-clamp-2 min-w-0 flex-1 text-base/[22px] wrap-anywhere", isRpb ? "font-bold" : "font-medium")}>
        {team.name}
      </span>
      <span
        className={cx(
          "font-display text-[40px] leading-none font-black tabular-nums",
          isRpb ? "text-rpb-gold" : "text-rpb-cream",
        )}
      >
        {score}
      </span>
    </div>
  );
}
