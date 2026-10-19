import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { SortIcon } from "@/components/ui/icons/SortIcon";
import { cx } from "@/lib/cx";
import type { PlayerStatColumn, PlayerStatSort, PlayerStatSortKey } from "@/models/playerStatColumns";

type SortableColumnHeaderProps = {
  column: PlayerStatColumn;
  sort: PlayerStatSort;
  onSort: (key: PlayerStatSortKey) => void;
};

export function SortableColumnHeader({ column, sort, onSort }: SortableColumnHeaderProps) {
  const isSorted = sort.key === column.key;
  const isName = column.key === "name";

  return (
    <th
      scope="col"
      aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
      className={cx(
        "border-b-2 border-rpb-ink bg-rpb-cream p-0 text-xs font-semibold tracking-[.06em] whitespace-nowrap uppercase",
        isName && "sticky left-0 z-[2] min-w-[168px] border-r border-r-rpb-ink/12 text-left",
        column.key === "twoPoints" && "border-l-2 border-l-rpb-ink/12",
      )}
    >
      <button
        type="button"
        title={column.label}
        onClick={() => onSort(column.key)}
        className={cx(
          "flex min-h-11 w-full items-center gap-1 rounded-sm px-2 uppercase focus-ring hover:bg-rpb-gold-light hover:text-rpb-ink",
          isName ? "justify-start pl-3" : "justify-end",
          isSorted ? "text-rpb-ink" : "text-rpb-ink/72",
        )}
      >
        {isName ? (
          column.label
        ) : (
          <>
            <span aria-hidden="true">{column.abbr}</span>
            <span className="sr-only">{column.label}</span>
          </>
        )}
        {!isSorted ? (
          <SortIcon size={14} strokeWidth={2.5} className="shrink-0" />
        ) : (
          <ChevronDownIcon
            size={14}
            strokeWidth={2.5}
            className={cx("shrink-0 text-rpb-bordeaux", sort.direction === "asc" && "rotate-180")}
          />
        )}
      </button>
    </th>
  );
}
