import Link from "next/link";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { RankChip } from "@/components/ui/RankChip";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { formatHallOfFameValue } from "@/models/formatHallOfFameValue";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { HallOfFameCategory } from "@/models/HallOfFameCategory";
import type { HallOfFameEntry } from "@/models/HallOfFameEntry";
import type { HallOfFameMode } from "@/models/HallOfFameMode";

type HallOfFameRowProps = {
  entry: HallOfFameEntry;
  category: HallOfFameCategory;
  mode: HallOfFameMode;
  /** Rang partagé avec un autre joueur. */
  shared: boolean;
};

/** Toute la ligne est un lien vers la fiche du joueur (`stretched-link` sur le `<tr relative>`). */
export function HallOfFameRow({ entry, category, mode, shared }: HallOfFameRowProps) {
  return (
    <tr className="relative border-b border-rpb-ink/12 transition-colors last:border-b-0 hover:bg-rpb-gold-light">
      <th scope="row" className="h-12 pr-0 pl-1.5 text-left font-normal">
        <RankChip rank={entry.rank} gold={entry.rank === 1 && !category.lowerIsBetter} animated={false} />
      </th>
      <td className="h-12 px-2">
        <Link
          href={buildPlayerHref(entry.player.licence)}
          className="stretched-link flex min-w-0 items-center gap-2.5 text-rpb-ink no-underline"
        >
          <PlayerAvatar player={entry.player} size="sm" decorative />
          <span className="flex min-w-0 flex-col">
            <span className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">
              {formatPlayerName(entry.player)}
            </span>
            {shared && <span className="text-[11px] leading-4 text-rpb-ink/72">ex æquo</span>}
          </span>
        </Link>
      </td>
      <td className="h-12 pr-1.5 pl-2 text-right text-base font-extrabold whitespace-nowrap tabular-nums">
        {formatHallOfFameValue(entry.value, category, mode)}
      </td>
    </tr>
  );
}
