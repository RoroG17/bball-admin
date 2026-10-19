import { buildAdminHref } from "@/models/buildAdminHref";

/** `/admin/user/create?q=…&joueur=…` : valeurs vides omises, ordre `q` puis `joueur`. */
export function buildAccountCreateHref(params: { q?: string; licence?: string | null }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.licence) search.set("joueur", params.licence);
  const query = search.toString();
  const base = buildAdminHref("user", "create");
  return query ? `${base}?${query}` : base;
}
