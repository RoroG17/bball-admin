export type SortDirection = "asc" | "desc";
export type SortState = { column: string; direction: SortDirection };

export type AdminListSpec = {
  /** Ids de colonnes triables. */
  sortable: readonly string[];
  defaultSort: SortState;
  /** Clés de filtres acceptées (valeurs validées par la feature). */
  filters: readonly string[];
};

export type AdminListQuery = {
  q: string;
  sort: SortState;
  filters: Readonly<Record<string, string>>;
  page: number;
};

/** Paramètres d'URL tels que Next les fournit (`searchParams` résolu). */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const ADMIN_LIST_SEARCH_MAX_LENGTH = 100;
