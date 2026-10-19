import {
  ADMIN_LIST_SEARCH_MAX_LENGTH,
  type AdminListQuery,
  type AdminListSpec,
  type RawSearchParams,
  type SortDirection,
} from "@/models/AdminListQuery";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Interprète les paramètres d'URL d'une liste : `q`, `tri`, `ordre`, `page` et les clés de `spec.filters`.
 * Toute valeur invalide retombe sur le défaut ; les clés inconnues (dont `notice`, `ref`) sont ignorées.
 */
export function parseAdminListQuery(raw: RawSearchParams, spec: AdminListSpec): AdminListQuery {
  const q = (firstValue(raw.q) ?? "").trim().slice(0, ADMIN_LIST_SEARCH_MAX_LENGTH);

  const column = firstValue(raw.tri);
  const direction = firstValue(raw.ordre);
  const sort = {
    column: column !== undefined && spec.sortable.includes(column) ? column : spec.defaultSort.column,
    direction: (direction === "asc" || direction === "desc" ? direction : spec.defaultSort.direction) as SortDirection,
  };

  const rawPage = firstValue(raw.page) ?? "";
  const parsedPage = /^\d+$/.test(rawPage) ? Number(rawPage) : 0;
  const page = Number.isSafeInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const filters: Record<string, string> = {};
  for (const key of spec.filters) {
    const value = firstValue(raw[key]);
    if (value) filters[key] = value;
  }

  return { q, sort, filters, page };
}
