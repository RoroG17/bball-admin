import { ArrowDownIcon } from "@/components/ui/icons/ArrowDownIcon";
import { ArrowUpIcon } from "@/components/ui/icons/ArrowUpIcon";
import { EqualIcon } from "@/components/ui/icons/EqualIcon";
import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import type { StatComparison } from "@/models/compareToAverage";

type StatComparisonIconProps = {
  comparison: StatComparison;
  /** Rang de la tuile, pour la cascade. */
  index: number;
};

/** Pastille décorative (`aria-hidden`) : le sens est aussi écrit en texte pour les lecteurs d'écran (DS46). */
export function StatComparisonIcon({ comparison, index }: StatComparisonIconProps) {
  if (comparison === "noAverage") return null;

  return (
    <span
      aria-hidden="true"
      className={cx(
        "pop flex size-5 shrink-0 items-center justify-center rounded-full",
        comparison === "above" && "bg-rpb-gold text-rpb-ink",
        comparison === "below" && "bg-rpb-ink text-rpb-cream",
        comparison === "equal" && "border-[1.5px] border-rpb-ink/30 text-rpb-ink",
      )}
      style={animationDelay(700 + index * 60)}
    >
      {comparison === "above" && <ArrowUpIcon size={12} strokeWidth={3} />}
      {comparison === "below" && <ArrowDownIcon size={12} strokeWidth={3} />}
      {comparison === "equal" && <EqualIcon size={12} strokeWidth={3} />}
    </span>
  );
}
