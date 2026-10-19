import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { RowLink } from "@/components/ui/RowLink";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { Player } from "@/models/Player";

type RosterRowProps = {
  player: Player;
  /** Délai de l'entrée en glissé ; sans valeur, pas d'animation. */
  delayMs?: number;
  showChevron?: boolean;
};

/** Toute la ligne mène à la fiche du joueur. */
export function RosterRow({ player, delayMs, showChevron = true }: RosterRowProps) {
  return (
    <li>
      <RowLink href={`/player/${encodeURIComponent(player.licence)}`} delayMs={delayMs}>
        <PlayerAvatar player={player} size="md" />
        <span className="min-w-0 flex-1 font-medium">{formatPlayerName(player)}</span>
        {showChevron && <ChevronRightIcon size={16} className="chev shrink-0 text-rpb-bordeaux" />}
      </RowLink>
    </li>
  );
}
