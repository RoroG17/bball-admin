/** Page d'une liste paginée par le back. `pageCount ≥ 1` même vide. */
export type Page<T> = {
  items: readonly T[];
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
};
