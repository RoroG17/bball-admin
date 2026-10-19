import { TeamLogo } from "@/components/ui/TeamLogo";
import { cx } from "@/lib/cx";
import type { GameTeam } from "@/models/GameTeam";

type ScoreboardTeamProps = { team: GameTeam; isRpb: boolean };

export function ScoreboardTeam({ team, isRpb }: ScoreboardTeamProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb={isRpb} context="hero" decorative />
      <span
        className={cx("line-clamp-3 text-[15px]/5 wrap-anywhere @2xl:text-lg/6", isRpb ? "font-bold" : "font-medium")}
      >
        {team.name}
      </span>
    </div>
  );
}
