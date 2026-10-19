import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { PlayerListEntry } from "@/models/PlayerListEntry";

type PlayerCardProps = {
  entry: PlayerListEntry;
  seasonParam: string | null;
  /** Rang pour l'entrée en cascade ; `null` = pas d'animation (après une recherche). */
  animationIndex: number | null;
};

/** Carte entièrement cliquable par un seul lien, au nom concis. Ni date de naissance ni civilité (P2, D19). */
export function PlayerCard({ entry, seasonParam, animationIndex }: PlayerCardProps) {
  const { player, team } = entry;

  return (
    <li
      className={cx(
        "group lift relative flex min-h-[84px] min-w-0 items-center gap-3.5 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-3.5 shadow-card transition-colors hover:border-rpb-ink hover:bg-rpb-gold-light",
        animationIndex !== null && "reveal",
      )}
      style={animationIndex !== null ? animationDelay(120 + Math.min(animationIndex, 12) * 30) : undefined}
    >
      <PlayerAvatar player={player} size="xl" decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={buildPlayerHref(player.licence, { saison: seasonParam ?? undefined })}
          className="stretched-link line-clamp-2 text-base/[22px] font-bold wrap-anywhere text-rpb-ink no-underline"
        >
          {formatPlayerName(player)}
        </Link>
        <p className="flex min-w-0 items-center gap-1.5 text-[13px]/[18px] text-rpb-ink/72">
          <TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb context="inline" decorative />
          <span className="truncate">{team.name}</span>
        </p>
      </div>
      <ChevronRightIcon
        size={16}
        strokeWidth={2.5}
        className="shrink-0 text-rpb-bordeaux transition-transform group-hover:translate-x-[3px]"
      />
    </li>
  );
}
