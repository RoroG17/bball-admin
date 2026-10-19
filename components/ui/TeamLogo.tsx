"use client";

import Image from "next/image";
import { useState } from "react";
import { cx } from "@/lib/cx";
import { getTeamInitials } from "@/models/getTeamInitials";

type TeamLogoContext = "hero" | "scoreboard" | "card" | "row" | "inline" | "list" | "preview";

type TeamLogoProps = {
  name: string;
  logoUrl: string | null;
  isRpb: boolean;
  /**
   * `hero` : 56px sur fond bordeaux (fiche match) ; `scoreboard` : 40px sur fond bordeaux ; `card` : 52px sur fond crème ;
   * `row` : 32px, masqué quand le conteneur `@container` fait moins de 448px ; `inline` : 24px, toujours visible, dans une ligne de texte ;
   * `list` : 40px sur fond crème (lignes des tableaux d'administration) ; `preview` : 64px (aperçu d'un formulaire).
   */
  context: TeamLogoContext;
  /** Le nom de l'équipe est écrit à côté : pas d'alternative textuelle. */
  decorative?: boolean;
};

const SIZES: Record<TeamLogoContext, { className: string; px: number }> = {
  hero: { className: "size-14 text-lg", px: 56 },
  scoreboard: { className: "size-10 text-[13px]", px: 40 },
  card: { className: "size-[52px] text-[15px]", px: 52 },
  row: { className: "hidden @md:flex size-8 text-[11px]", px: 32 },
  inline: { className: "size-6 text-[9px]", px: 24 },
  list: { className: "size-10 text-[13px]", px: 40 },
  preview: { className: "size-16 text-xl", px: 64 },
};

const CARD_COLORS = { rpb: "bg-rpb-bordeaux text-rpb-gold", opponent: "bg-rpb-gold-light text-rpb-bordeaux" };
const FALLBACK_CLASSES: Record<TeamLogoContext, { rpb: string; opponent: string }> = {
  hero: { rpb: "bg-rpb-ink text-rpb-gold", opponent: "bg-rpb-cream text-rpb-bordeaux" },
  scoreboard: { rpb: "bg-rpb-ink text-rpb-gold", opponent: "bg-rpb-cream text-rpb-bordeaux" },
  card: CARD_COLORS,
  row: CARD_COLORS,
  inline: CARD_COLORS,
  list: CARD_COLORS,
  preview: CARD_COLORS,
};

/**
 * Logo de l'équipe, ou ses initiales s'il n'y en a pas ou si le fichier est introuvable (jamais d'image cassée). Client
 * Component : le repli se déclenche quand le navigateur n'arrive pas à charger l'image.
 */
export function TeamLogo({ name, logoUrl, isRpb, context, decorative = false }: TeamLogoProps) {
  const { className: sizeClass, px } = SIZES[context];
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (logoUrl && failedUrl !== logoUrl) {
    return (
      <span className={cx("flex shrink-0 items-center justify-center", sizeClass)}>
        <Image
          src={logoUrl}
          alt={decorative ? "" : `Logo ${name}`}
          width={px}
          height={px}
          className="size-full object-contain"
          onError={() => setFailedUrl(logoUrl)}
          ref={(image) => {
            // L'erreur a pu survenir avant l'hydratation : l'événement `error` est alors perdu.
            if (image?.complete && image.naturalWidth === 0) setFailedUrl(logoUrl);
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full font-display font-black",
        sizeClass,
        FALLBACK_CLASSES[context][isRpb ? "rpb" : "opponent"],
      )}
    >
      <span aria-hidden="true">{getTeamInitials(name)}</span>
      {!decorative && <span className="sr-only">{`Logo ${name}`}</span>}
    </span>
  );
}
