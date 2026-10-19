import { HALL_OF_FAME_MODE_LABELS, type HallOfFameMode } from "@/models/HallOfFameMode";
import type { HallOfFameCategory } from "@/models/HallOfFameCategory";
import type { HallOfFameEntry } from "@/models/HallOfFameEntry";
import { isSharedRank } from "@/models/isSharedRank";
import { HallOfFameRow } from "@/views/hall-of-fame/components/HallOfFameRow";

type HallOfFameTableProps = {
  entries: HallOfFameEntry[];
  category: HallOfFameCategory;
  mode: HallOfFameMode;
};

/** Jamais appelé avec une liste vide. Aucun défilement interne : toutes les lignes sont visibles. */
export function HallOfFameTable({ entries, category, mode }: HallOfFameTableProps) {
  return (
    <table className="w-full table-fixed border-collapse tabular-nums">
      <caption className="sr-only">
        {category.title} : {HALL_OF_FAME_MODE_LABELS[mode].long}, top {entries.length}
      </caption>
      <colgroup>
        <col className="w-10" />
        <col />
        <col className="w-[76px]" />
      </colgroup>
      <thead className="sr-only">
        <tr>
          <th scope="col">Rang</th>
          <th scope="col">Joueur</th>
          <th scope="col">Valeur</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <HallOfFameRow
            key={entry.player.licence}
            entry={entry}
            category={category}
            mode={mode}
            shared={isSharedRank(entries, index)}
          />
        ))}
      </tbody>
    </table>
  );
}
