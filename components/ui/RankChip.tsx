import { cx } from "@/lib/cx";

type RankChipProps = {
  rank: number;
  /** Pastille or du n°1 (jamais pour les ballons perdus). */
  gold: boolean;
  /** `false` : sans l'animation d'apparition de la pastille or (panneaux masqués puis réaffichés). */
  animated?: boolean;
};

export function RankChip({ rank, gold, animated = true }: RankChipProps) {
  return (
    <span
      className={cx(
        "flex size-7 shrink-0 items-center justify-center rounded-md font-display text-sm tabular-nums",
        gold
          ? cx("bg-rpb-ink font-black text-rpb-gold", animated && "chip-gold")
          : "border-[1.5px] border-rpb-ink/30 font-extrabold",
      )}
    >
      <span className="sr-only">Rang </span>
      {rank}
    </span>
  );
}
