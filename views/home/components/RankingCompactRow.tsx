import { RowLink } from "@/components/ui/RowLink";
import { formatPlayerName } from "@/models/formatPlayerName";
import { formatRankingValue } from "@/models/formatRankingValue";
import type { RankingCategory } from "@/models/RankingCategory";
import type { RankingEntry } from "@/models/RankingEntry";

type RankingCompactRowProps = {
  entry: RankingEntry;
  category: RankingCategory;
};

/** Ligne simplifiée de la suite du classement : rang, nom et valeur. */
export function RankingCompactRow({ entry, category }: RankingCompactRowProps) {
  return (
    <li>
      <RowLink href={`/player/${encodeURIComponent(entry.player.licence)}`} variant="ranking">
        <span className="w-7 shrink-0 text-center font-display text-sm font-extrabold tabular-nums">
          <span className="sr-only">Rang </span>
          {entry.rank}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{formatPlayerName(entry.player)}</span>
        <span className="font-bold tabular-nums">{formatRankingValue(entry.value, category.valueUnit)}</span>
      </RowLink>
    </li>
  );
}
