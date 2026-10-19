import { TeamLogo } from "@/components/ui/TeamLogo";
import { cx } from "@/lib/cx";
import type { GameTeam } from "@/models/GameTeam";

type MatchupTeamProps = {
  team: GameTeam;
  isRpb: boolean;
  /** Logo décoratif (`alt=""`) quand le nom est déjà annoncé par ailleurs. */
  decorative?: boolean;
};

/** Équipe du face-à-face du prochain match : logo puis nom, sans score. */
export function MatchupTeam({ team, isRpb, decorative = false }: MatchupTeamProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb={isRpb} context="card" decorative={decorative} />
      <span className={cx("text-[15px] wrap-anywhere", isRpb ? "font-bold" : "font-medium")}>{team.name}</span>
    </div>
  );
}
