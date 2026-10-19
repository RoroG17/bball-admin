"use client";

import Image from "next/image";
import { useState } from "react";
import { cx } from "@/lib/cx";
import { formatPlayerName } from "@/models/formatPlayerName";
import { getPlayerInitials } from "@/models/getPlayerInitials";
import type { Player } from "@/models/Player";

type PlayerAvatarProps = {
  player: Pick<Player, "firstName" | "lastName" | "photoUrl">;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** `gold` : sur fond bordeaux (tuiles leaders). */
  tone?: "light" | "gold";
  /** Le nom est écrit à côté : la photo n'a pas d'alternative textuelle. */
  decorative?: boolean;
};

const SIZES = {
  sm: { px: 30, className: "size-[30px] text-[11px]" },
  md: { px: 36, className: "size-9 text-[13px]" },
  lg: { px: 44, className: "size-11 text-sm" },
  xl: { px: 56, className: "size-14 text-lg" },
  "2xl": { px: 80, className: "size-20 text-[26px]" },
};

/** Photo du joueur, ou ses initiales si elle est absente ou ne se charge pas. */
export function PlayerAvatar({ player, size = "md", tone = "light", decorative = false }: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const { px, className } = SIZES[size];
  const showPhoto = player.photoUrl !== null && !failed;

  return (
    <span
      className={cx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-extrabold",
        tone === "gold" ? "bg-rpb-gold text-rpb-ink" : "bg-rpb-gold-light text-rpb-bordeaux",
        className,
      )}
    >
      {showPhoto ? (
        <Image
          src={player.photoUrl!}
          alt={decorative ? "" : `Photo de ${formatPlayerName(player)}`}
          width={px}
          height={px}
          className="size-full rounded-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{getPlayerInitials(player)}</span>
      )}
    </span>
  );
}
