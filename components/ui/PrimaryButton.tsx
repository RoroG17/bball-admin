import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type PrimaryButtonProps = {
  /**
   * `gold` : uniquement sur fond sombre ; `outline` : action secondaire sur fond clair ; `danger` : action destructive
   * (suppression), toujours accompagnée d'un libellé explicite.
   */
  variant?: "primary" | "gold" | "outline" | "danger";
  /**
   * `md` : 44 px ; `lg` : 48 px pleine largeur, pour l'action principale d'un formulaire (DS76) ;
   * `tall` : 48 px compact, pour une action tactile dans l'en-tête (DS80).
   */
  size?: "md" | "lg" | "tall";
  /** Rendu en lien si fourni, sinon en bouton. */
  href?: string;
  /** Lien seulement : `false` désactive le préchargement (les lectures de journaux sont elles-mêmes journalisées). */
  prefetch?: boolean;
  /** Type du bouton (ignoré pour un lien). `submit` dans un formulaire. */
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  /** Envoi en cours : désactivé, `aria-busy`, fond foncé sans perte de contraste (DS77). */
  busy?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES = {
  primary: "bg-rpb-bordeaux text-rpb-cream hover:bg-rpb-bordeaux-dark",
  gold: "border-2 border-rpb-ink bg-rpb-gold text-rpb-ink hover:bg-rpb-gold-light",
  outline: "border-2 border-rpb-bordeaux bg-rpb-cream text-rpb-bordeaux hover:bg-rpb-gold-light",
  danger: "bg-danger text-rpb-cream hover:bg-rpb-ink",
};

const BUSY_CLASSES = {
  primary: "aria-busy:cursor-progress aria-busy:bg-rpb-bordeaux-dark",
  gold: "aria-busy:cursor-progress aria-busy:bg-rpb-bordeaux-dark",
  outline: "aria-busy:cursor-progress aria-busy:bg-rpb-bordeaux-dark",
  danger: "aria-busy:cursor-progress aria-busy:bg-rpb-ink",
};

const SIZE_CLASSES = {
  md: "min-h-11 px-[18px]",
  lg: "min-h-12 w-full justify-center px-[18px] text-base",
  tall: "min-h-12 px-4 text-sm",
};

export function PrimaryButton({
  variant = "primary",
  size = "md",
  href,
  prefetch,
  type = "button",
  onClick,
  disabled,
  busy = false,
  children,
}: PrimaryButtonProps) {
  const className = cx(
    "inline-flex items-center gap-2 rounded-lg font-bold no-underline transition-colors focus-ring",
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
  );

  if (href) {
    return (
      <Link href={href} prefetch={prefetch} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(
        className,
        busy ? BUSY_CLASSES[variant] : "disabled:opacity-60",
      )}
    >
      {children}
    </button>
  );
}
