import { DEFAULT_LOG_KIND, LOG_KIND_PARAMS } from "@/models/LogKind";
import { LOG_FILTER_KEYS } from "@/models/LogFilters";
import type { LogListQuery } from "@/models/LogListQuery";

/**
 * Forme canonique de l'URL : `/admin/logs` puis `type`, filtres (ordre de `LOG_FILTER_KEYS`), `page`, `detail`. Les
 * valeurs par défaut sont omises. Le fragment `#detail` n'en fait pas partie (ajouté par l'appelant).
 */
export function buildLogListHref(query: LogListQuery): string {
  const params = new URLSearchParams();
  if (query.kind !== DEFAULT_LOG_KIND) params.set("type", LOG_KIND_PARAMS[query.kind]);
  for (const key of LOG_FILTER_KEYS) {
    const value = query.filters[key];
    if (value !== undefined) params.set(key, value);
  }
  if (query.page > 1) params.set("page", String(query.page));
  if (query.detailId !== null) params.set("detail", String(query.detailId));
  const search = params.toString();
  return search ? `/admin/logs?${search}` : "/admin/logs";
}
