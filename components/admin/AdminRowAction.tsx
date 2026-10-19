import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type AdminRowActionProps = {
  href: string;
  /** Texte visible : « Modifier ». */
  label: string;
  /** Sujet de la ligne : « Lucas Marchand ». Le nom accessible est « {label} {subject} » (WCAG 2.5.3). */
  subject: string;
  icon?: ReactNode;
  tone?: "default" | "danger";
  /** Désactive le préchargement du lien (écrans dont la lecture est elle-même journalisée). */
  prefetch?: boolean;
  /** Entrée actuellement ouverte : fond bordeaux et `aria-current`. */
  current?: boolean;
  /** Nom accessible complet, si « {label} {subject} » ne convient pas. */
  accessibleName?: string;
};

/** Lien-bouton d'une ligne ou d'un en-tête : cible de 44 px, sens porté par l'icône et le texte, jamais la couleur seule. */
export function AdminRowAction({
  href,
  label,
  subject,
  icon,
  tone = "default",
  prefetch,
  current = false,
  accessibleName,
}: AdminRowActionProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      aria-current={current ? "true" : undefined}
      aria-label={accessibleName ?? `${label} ${subject}`}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg border-2 bg-rpb-cream px-3 text-sm font-bold whitespace-nowrap no-underline transition-colors focus-ring",
        current
          ? "border-rpb-bordeaux bg-rpb-bordeaux text-rpb-cream hover:bg-rpb-bordeaux-dark"
          : tone === "danger"
            ? "border-danger text-danger hover:bg-danger hover:text-rpb-cream"
            : "border-rpb-bordeaux text-rpb-bordeaux hover:bg-rpb-gold-light",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
