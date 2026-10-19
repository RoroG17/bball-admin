import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { Player } from "@/models/Player";
import { buildPlayerHref } from "@/models/buildPlayerHref";

type AdminPlayerIdentityCellProps = {
  player: Player;
  /** Joueur qui vient d'être modifié : pastille « Vient d'être enregistré » (le sens passe par le texte). */
  highlighted: boolean;
};

/** Photo (ou initiales, décorative) et lien « Prénom Nom » vers la fiche publique. */
export function AdminPlayerIdentityCell({ player, highlighted }: AdminPlayerIdentityCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <PlayerAvatar player={player} size="lg" decorative />
      <div className="flex max-w-[300px] min-w-0 flex-col items-start gap-1 @max-[520px]/tbl:max-w-[120px]">
        <Link
          href={buildPlayerHref(player.licence)}
          className="text-[15px]/[22px] font-bold wrap-anywhere text-rpb-bordeaux underline-offset-[3px] hover:underline focus-ring"
        >
          {formatPlayerName(player)}
        </Link>
        {highlighted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rpb-ink px-[9px] py-px text-xs font-bold text-rpb-gold">
            <CheckIcon size={14} strokeWidth={3} />
            Vient d&apos;être enregistré
          </span>
        )}
      </div>
    </div>
  );
}
