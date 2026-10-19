import { useId, type ReactNode } from "react";
import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";

export type CardAnimation = "reveal" | "on-scroll";

type CardProps = {
  title: string;
  titleLevel?: 2 | 3;
  /** `card` : titre de carte ; `ranking` : titre de carte de classement ; `eyebrow` : surtitre. */
  titleStyle?: "card" | "ranking" | "eyebrow";
  subtitle?: ReactNode;
  /** Contenu affiché à droite du titre (compteur…). */
  aside?: ReactNode;
  /** Bordure encre pleine au lieu de la bordure légère. */
  strong?: boolean;
  /** Soulèvement au survol. */
  interactive?: boolean;
  animation?: CardAnimation;
  delayMs?: number;
  tight?: boolean;
  className?: string;
  children: ReactNode;
};

const TITLE_CLASSES = {
  card: "font-display text-xl font-extrabold leading-tight",
  ranking: "font-display text-lg font-extrabold",
  eyebrow: "text-xs font-semibold uppercase tracking-[.08em] text-rpb-bordeaux",
};

export function Card({
  title,
  titleLevel = 2,
  titleStyle = "card",
  subtitle,
  aside,
  strong = false,
  interactive = false,
  animation,
  delayMs,
  tight = false,
  className,
  children,
}: CardProps) {
  const titleId = useId();
  const Heading = titleLevel === 2 ? "h2" : "h3";

  const heading = (
    <div className="flex min-w-0 flex-col gap-1">
      <Heading id={titleId} className={TITLE_CLASSES[titleStyle]}>
        {title}
      </Heading>
      {subtitle}
    </div>
  );

  return (
    <section
      aria-labelledby={titleId}
      className={cx(
        "flex min-w-0 flex-col rounded-lg border-2 bg-rpb-cream p-5 shadow-card",
        tight ? "gap-2.5" : "gap-4",
        strong ? "border-rpb-ink" : "border-rpb-ink/14",
        interactive && "lift",
        animation,
        className,
      )}
      style={animation === "reveal" ? animationDelay(delayMs) : undefined}
    >
      {aside ? (
        <div className="flex items-baseline justify-between gap-2">
          {heading}
          {aside}
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  );
}
