import Link from "next/link";
import type { AdminColumnHeader } from "@/components/admin/AdminColumn";
import { ArrowDownIcon } from "@/components/ui/icons/ArrowDownIcon";
import { ArrowUpIcon } from "@/components/ui/icons/ArrowUpIcon";
import { SortIcon } from "@/components/ui/icons/SortIcon";
import { cx } from "@/lib/cx";
import type { SortState } from "@/models/AdminListQuery";

type AdminTableHeaderCellProps = {
  column: AdminColumnHeader;
  sort: SortState;
  /** Lien de tri de la colonne (déjà canonique). */
  href: string;
  /** Tableau dense : marges horizontales de 12 px au lieu de 16 px. */
  compact?: boolean;
};

/** `<th>` d'une colonne : triable = lien avec flèche (le sens ne passe jamais par la couleur seule) et `aria-sort`. */
export function AdminTableHeaderCell({ column, sort, href, compact = false }: AdminTableHeaderCellProps) {
  const sorted = sort.column === column.id;
  const cellClasses = cx(
    "border-b-2 border-rpb-ink bg-rpb-cream text-xs/4 font-semibold tracking-[.08em] whitespace-nowrap text-rpb-ink/72 uppercase",
    column.align === "end" ? "text-right" : "text-left",
    column.sticky && "sticky left-0 z-[1] border-r border-r-rpb-ink/12 @max-[520px]/tbl:px-3",
    compact ? "px-3" : "px-4",
    !column.sortable && "py-3.5",
    column.className,
  );

  if (!column.sortable) {
    return (
      <th scope="col" className={cellClasses}>
        {column.header}
      </th>
    );
  }

  const ariaSort = sorted ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
  const nextDirection = sorted && sort.direction === "asc" ? "décroissant" : "croissant";
  const Icon = sorted ? (sort.direction === "asc" ? ArrowUpIcon : ArrowDownIcon) : SortIcon;

  return (
    <th scope="col" aria-sort={ariaSort} className={cellClasses}>
      <Link
        href={href}
        className={cx(
          "inline-flex min-h-11 items-center gap-1.5 no-underline hover:text-rpb-bordeaux focus-ring",
          sorted ? "text-rpb-ink" : "text-rpb-ink/72",
          column.align === "end" && "flex-row-reverse",
        )}
      >
        {column.header}
        <Icon size={14} strokeWidth={2.5} />
        <span className="sr-only">, trier par ordre {nextDirection}</span>
      </Link>
    </th>
  );
}
