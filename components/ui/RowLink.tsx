import Link from "next/link";
import type { ReactNode } from "react";
import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";

type RowLinkProps = {
  href: string;
  /** `ranking` : lignes plus serrées des cartes de classement. */
  variant?: "default" | "ranking";
  /** Entrée en glissé (`row-in`) avec ce délai. */
  delayMs?: number;
  ariaLabel?: string;
  children: ReactNode;
};

export function RowLink({ href, variant = "default", delayMs, ariaLabel, children }: RowLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cx(
        "-mx-2.5 flex min-h-11 items-center rounded-md px-2.5 text-rpb-ink no-underline transition-colors hover:bg-rpb-gold-light focus-ring",
        variant === "ranking" ? "gap-2.5 py-1.5" : "gap-3 py-2",
        delayMs !== undefined && "row-in",
      )}
      style={animationDelay(delayMs)}
    >
      {children}
    </Link>
  );
}
