import { CountUp } from "@/components/ui/CountUp";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { cx } from "@/lib/cx";
import type { GameTeam } from "@/models/GameTeam";

type GameTeamLineProps = {
  team: GameTeam;
  isRpb: boolean;
  /** Mention affichée après le nom du RPB. */
  sideLabel?: "domicile" | "extérieur";
  /** Faux si le score n'a pas été saisi : on affiche un tiret. */
  scoreEntered: boolean;
};

/** Ligne d'une équipe dans le tableau de score (fond bordeaux). */
export function GameTeamLine({ team, isRpb, sideLabel, scoreEntered }: GameTeamLineProps) {
  return (
    <div className="flex items-center gap-3">
      <TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb={isRpb} context="scoreboard" />
      <span className={cx("min-w-0 flex-1 text-base", isRpb ? "font-bold" : "font-medium")}>
        {team.name}
        {isRpb && sideLabel && (
          <span className="text-[13px] font-normal text-rpb-gold-light"> · {sideLabel}</span>
        )}
      </span>
      <span
        className={cx(
          "font-display text-[40px] leading-none font-black tabular-nums",
          isRpb ? "text-rpb-gold" : "text-rpb-cream",
        )}
      >
        {scoreEntered ? <CountUp value={team.score} kind="integer" /> : "–"}
      </span>
    </div>
  );
}
