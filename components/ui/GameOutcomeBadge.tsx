import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { GAME_OUTCOME_LABELS } from "@/models/gameOutcomeLabels";
import type { GameOutcome } from "@/models/GameOutcome";
import { OutcomeIcon } from "@/components/ui/OutcomeIcon";

type GameOutcomeBadgeProps = {
  outcome: GameOutcome;
  /** Délai de l'animation `pop` (ms). Sans valeur, pas d'animation. */
  popDelayMs?: number;
};

const OUTCOME_CLASSES: Record<Exclude<GameOutcome, "unknown">, string> = {
  win: "bg-success text-rpb-cream border-[1.5px] border-rpb-ink",
  loss: "bg-rpb-ink text-rpb-cream border-[1.5px] border-rpb-cream",
  draw: "bg-rpb-cream text-rpb-ink border-[1.5px] border-rpb-ink",
  notEntered: "bg-rpb-gold-light text-rpb-ink",
};

/** Résultat toujours écrit en toutes lettres, jamais porté par la couleur seule. */
export function GameOutcomeBadge({ outcome, popDelayMs }: GameOutcomeBadgeProps) {
  if (outcome === "unknown") return null;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold",
        OUTCOME_CLASSES[outcome],
        popDelayMs !== undefined && "pop",
      )}
      style={animationDelay(popDelayMs)}
    >
      <OutcomeIcon outcome={outcome} />
      {GAME_OUTCOME_LABELS[outcome]}
    </span>
  );
}
