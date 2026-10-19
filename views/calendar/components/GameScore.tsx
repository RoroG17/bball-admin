import { cx } from "@/lib/cx";
import type { GameSide } from "@/models/GameOutcome";

type GameScoreProps = {
  home: number;
  away: number;
  rpbSide: GameSide | null;
};

/** Mini tableau de score (domicile – extérieur), score du RPB en or. Uniquement pour un match joué. */
export function GameScore({ home, away, rpbSide }: GameScoreProps) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-rpb-ink bg-rpb-bordeaux px-2.5 py-1.5 font-display text-xl leading-none font-black text-rpb-cream tabular-nums">
        <span className={cx(rpbSide === "home" && "text-rpb-gold")}>{home}</span>
        <span>–</span>
        <span className={cx(rpbSide === "away" && "text-rpb-gold")}>{away}</span>
      </span>
      <span className="text-[11px] text-rpb-ink/72">Score final</span>
    </>
  );
}
