import type { AdminListQuery, AdminListSpec } from "@/models/AdminListQuery";

/**
 * Forme canonique d'une liste : omet les valeurs par défaut (`q` vide, tri et ordre par défaut, page 1). Ordre fixe :
 * `q`, filtres (ordre de `spec.filters`), `tri`, `ordre`, `page`. Sans paramètre : `basePath` seul.
 */
export function buildAdminListHref(basePath: string, query: AdminListQuery, spec: AdminListSpec): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  for (const key of spec.filters) {
    const value = query.filters[key];
    if (value) params.set(key, value);
  }
  if (query.sort.column !== spec.defaultSort.column) params.set("tri", query.sort.column);
  if (query.sort.direction !== spec.defaultSort.direction) params.set("ordre", query.sort.direction);
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}
