import Link from "next/link";
import type { ReactNode } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { ADMIN_LIST_SEARCH_MAX_LENGTH, type AdminListQuery, type AdminListSpec } from "@/models/AdminListQuery";

type AdminListToolbarProps = {
  basePath: string;
  query: AdminListQuery;
  spec: AdminListSpec;
  searchLabel: string;
  /** Filtres propres à la liste : `SelectField` non contrôlés, nommés comme les clés de `spec.filters`. */
  children?: ReactNode;
  isFiltered: boolean;
};

/**
 * Barre de recherche et de filtres : un formulaire GET, sans JavaScript. Le tri courant est conservé en champs cachés ;
 * la page repart à 1.
 */
export function AdminListToolbar({ basePath, query, spec, searchLabel, children, isFiltered }: AdminListToolbarProps) {
  return (
    <form
      method="get"
      action={basePath}
      role="search"
      aria-label={searchLabel}
      className="flex flex-wrap items-end gap-3 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-4"
    >
      <div className="min-w-0 flex-[2_1_260px]">
        <TextField
          label={searchLabel}
          name="q"
          type="search"
          defaultValue={query.q}
          maxLength={ADMIN_LIST_SEARCH_MAX_LENGTH}
          autoComplete="off"
        />
      </div>
      {children && <div className="min-w-0 flex-[1_1_200px]">{children}</div>}
      {query.sort.column !== spec.defaultSort.column && <input type="hidden" name="tri" value={query.sort.column} />}
      {query.sort.direction !== spec.defaultSort.direction && (
        <input type="hidden" name="ordre" value={query.sort.direction} />
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <PrimaryButton size="tall" type="submit">
          Rechercher
        </PrimaryButton>
        {isFiltered && (
          <Link
            href={basePath}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
          >
            Réinitialiser
          </Link>
        )}
      </div>
    </form>
  );
}
