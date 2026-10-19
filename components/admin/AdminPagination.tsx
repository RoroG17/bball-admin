import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { pluralize } from "@/lib/format";
import type { Page } from "@/models/Page";

type AdminPaginationProps = {
  page: Pick<Page<unknown>, "page" | "pageCount" | "total">;
  /** URL canonique de la page demandée. */
  buildHref: (page: number) => string;
  /** Nom des éléments paginés : « 134 erreurs ». */
  unit: { singular: string; plural: string };
};

const LINK_CLASSES =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-rpb-bordeaux bg-rpb-cream px-[18px] font-bold text-rpb-bordeaux no-underline transition-colors hover:bg-rpb-gold-light focus-ring";

/**
 * Pagination par liens (Précédent / Page x sur y / Suivant). Un lien indisponible est ABSENT, jamais un lien mort : un
 * espaceur garde le texte central stable. Masquée à une seule page. Les liens ne sont jamais préchargés.
 */
export function AdminPagination({ page, buildHref, unit }: AdminPaginationProps) {
  if (page.pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      {page.page > 1 ? (
        <Link href={buildHref(page.page - 1)} prefetch={false} className={LINK_CLASSES}>
          <ChevronLeftIcon size={18} strokeWidth={2.5} />
          Précédent
        </Link>
      ) : (
        <span aria-hidden="true" className="min-w-[130px]" />
      )}
      <p className="min-w-[180px] flex-[1_1_180px] text-center text-sm font-semibold tabular-nums">
        Page {page.page} sur {page.pageCount} ({pluralize(page.total, unit.singular, unit.plural)})
      </p>
      {page.page < page.pageCount ? (
        <Link href={buildHref(page.page + 1)} prefetch={false} className={LINK_CLASSES}>
          Suivant
          <ChevronRightIcon size={18} strokeWidth={2.5} />
        </Link>
      ) : (
        <span aria-hidden="true" className="min-w-[130px]" />
      )}
    </nav>
  );
}
