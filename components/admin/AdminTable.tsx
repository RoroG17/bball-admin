import type { ReactNode } from "react";
import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminTableHeaderCell } from "@/components/admin/AdminTableHeaderCell";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { cx } from "@/lib/cx";
import type { SortState } from "@/models/AdminListQuery";

type AdminTableProps<Row> = {
  /** Légende visible : sert aussi de compteur et d'indication de tri. */
  caption: string;
  columns: readonly AdminColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  sort: SortState;
  buildSortHref: (columnId: string) => string;
  /** Cellule d'actions de fin de ligne (en-tête « Actions » réservé aux lecteurs d'écran). */
  rowActions?: (row: Row) => ReactNode;
  /** Largeur minimale avant défilement horizontal : `md` 720 px (défaut), `lg` 900 px. */
  minWidth?: "md" | "lg";
  /** Ligne enregistrée à l'instant : fond or clair, barre bordeaux (le sens est porté par un texte dans la cellule). */
  isRowHighlighted?: (row: Row) => boolean;
  /** Tableau dense (journaux) : cellules de 12 px de marge, alignées en haut, pour les lignes de plusieurs lignes de texte. */
  compact?: boolean;
};

const MIN_WIDTH_CLASSES = { md: "min-w-[720px]", lg: "min-w-[900px]" };
const SCROLL_HINT_CLASSES = { md: "@max-[724px]/tbl:flex", lg: "@max-[904px]/tbl:flex" };

/**
 * Tableau d'une liste admin. Ne doit PAS être importé par un Client Component (props fonctions). Ne rend jamais un
 * tableau vide : la vue affiche `AdminEmptyState` quand il n'y a aucune ligne.
 */
export function AdminTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  sort,
  buildSortHref,
  rowActions,
  minWidth = "md",
  isRowHighlighted,
  compact = false,
}: AdminTableProps<Row>) {
  return (
    <div className="@container/tbl min-w-0">
      <div
        role="region"
        tabIndex={0}
        aria-label={caption}
        className="overflow-x-auto rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream shadow-card focus-ring"
      >
        <table className={cx("w-full border-separate border-spacing-0 text-left", MIN_WIDTH_CLASSES[minWidth])}>
          <caption className="px-4 pt-4 pb-3 text-left text-[13px]/5 text-rpb-ink/72 tabular-nums caption-top">
            {caption}
          </caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <AdminTableHeaderCell
                  key={column.id}
                  column={column}
                  sort={sort}
                  href={column.sortable ? buildSortHref(column.id) : ""}
                  compact={compact}
                />
              ))}
              {rowActions && (
                <th scope="col" className="border-b-2 border-rpb-ink bg-rpb-cream px-4 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const highlighted = isRowHighlighted?.(row) ?? false;
              const borderClass = rowIndex === rows.length - 1 ? "border-b-0" : "border-b border-rpb-ink/12";
              return (
                <tr key={getRowKey(row)}>
                  {columns.map((column, index) => (
                    <td
                      key={column.id}
                      className={cx(
                        borderClass,
                        compact ? "px-3 py-2.5 align-top" : "px-4 py-3 align-middle",
                        "text-sm/5 font-medium",
                        column.align === "end" && "text-right",
                        highlighted ? "bg-rpb-gold-light" : "bg-rpb-cream",
                        column.sticky && "sticky left-0 z-[1] border-r border-r-rpb-ink/12 @max-[520px]/tbl:px-3",
                        highlighted && index === 0 && "shadow-[inset_4px_0_0_0_var(--color-rpb-bordeaux)]",
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td
                      className={cx(
                        borderClass,
                        compact ? "px-3 py-2.5 align-top" : "px-4 py-3 align-middle",
                        highlighted ? "bg-rpb-gold-light" : "bg-rpb-cream",
                      )}
                    >
                      <div className="flex flex-wrap justify-end gap-2">{rowActions(row)}</div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={cx("mt-2 hidden items-center gap-1.5 text-[13px]/5 text-rpb-ink/72", SCROLL_HINT_CLASSES[minWidth])}>
        <ChevronRightIcon size={16} strokeWidth={2.5} className="shrink-0" />
        Fais défiler le tableau horizontalement pour voir les autres colonnes.
      </p>
    </div>
  );
}
