import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { RankChip } from "@/components/ui/RankChip";
import { RowLink } from "@/components/ui/RowLink";
import { formatDecimal } from "@/lib/format";
import { formatPlayerName } from "@/models/formatPlayerName";
import { formatRankingValue } from "@/models/formatRankingValue";
import type { RankingCategory } from "@/models/RankingCategory";
import type { RankingEntry } from "@/models/RankingEntry";

type RankingRowProps = {
  entry: RankingEntry;
  category: RankingCategory;
  /** Rang partagé avec un autre joueur. */
  shared: boolean;
  index: number;
};

export function RankingRow({ entry, category, shared, index }: RankingRowProps) {
  return (
    <li>
      <RowLink href={`/player/${encodeURIComponent(entry.player.licence)}`} variant="ranking" delayMs={150 + index * 70}>
        <RankChip rank={entry.rank} gold={entry.rank === 1 && !category.lowerIsBetter} />
        <PlayerAvatar player={entry.player} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{formatPlayerName(entry.player)}</span>
          {shared && <span className="text-[11px] text-rpb-ink/72">ex æquo</span>}
        </span>
        <span className="flex flex-col items-end">
          <span className="text-base font-extrabold tabular-nums">
            {formatRankingValue(entry.value, category.valueUnit)}
          </span>
          {entry.total !== null && (
            <span className="text-[11px] whitespace-nowrap text-rpb-ink/72 tabular-nums">
              {formatDecimal(entry.total, 0)} {category.totalLabel}
            </span>
          )}
        </span>
      </RowLink>
    </li>
  );
}
