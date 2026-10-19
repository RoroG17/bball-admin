import { ArrowUpRightIcon } from "@/components/ui/icons/ArrowUpRightIcon";
import { HouseIcon } from "@/components/ui/icons/HouseIcon";
import { cx } from "@/lib/cx";
import type { GameSide } from "@/models/GameOutcome";

type VenueBadgeProps = {
  side: GameSide | null;
  /** `pill` : pastille pleine (cartes) ; `label` : texte discret + icône (lignes de liste) ; `dark` : comme `label`, sur fond bordeaux. */
  variant?: "pill" | "label" | "dark";
};

const LABELS: Record<GameSide, string> = { home: "À domicile", away: "À l'extérieur" };

/** Lieu du match pour le RPB, toujours écrit en texte. Rien si le côté RPB est inconnu. */
export function VenueBadge({ side, variant = "pill" }: VenueBadgeProps) {
  if (side === null) return null;

  if (variant === "label" || variant === "dark") {
    const Icon = side === "home" ? HouseIcon : ArrowUpRightIcon;
    return (
      <span
        className={cx(
          "inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap",
          variant === "dark" ? "text-rpb-gold-light" : "text-rpb-ink/72",
        )}
      >
        <Icon size={14} strokeWidth={2.2} />
        {LABELS[side]}
      </span>
    );
  }

  return (
    <span
      className={cx(
        "rounded-full px-2.5 py-1 text-xs font-bold text-rpb-cream",
        side === "home" ? "bg-rpb-red" : "bg-rpb-ink",
      )}
    >
      {LABELS[side]}
    </span>
  );
}
