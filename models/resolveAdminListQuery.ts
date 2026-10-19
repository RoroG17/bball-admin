import type { AdminListQuery, AdminListSpec, RawSearchParams } from "@/models/AdminListQuery";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { parseAdminListQuery } from "@/models/parseAdminListQuery";
import { parseAdminNotice } from "@/models/parseAdminNotice";

/** Paramètres demandés qui concernent la liste (hors clés inconnues, `notice` et `ref`), en chaînes simples. */
function pickListParams(raw: RawSearchParams, spec: AdminListSpec): Record<string, string> | null {
  const picked: Record<string, string> = {};
  for (const key of ["q", "tri", "ordre", "page", ...spec.filters]) {
    const value = raw[key];
    if (value === undefined) continue;
    if (typeof value !== "string") return null;
    picked[key] = value;
  }
  return picked;
}

function sameParams(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

/**
 * Interprète l'URL d'une liste et dit s'il faut rediriger vers sa forme canonique (valeur invalide, valeur par défaut
 * écrite, `page=1`, espaces autour de `q`, tableau…). `notice` et `ref` sont conservés, en dernier. Sur une URL
 * canonique, `redirectTo` vaut `null` : jamais de boucle.
 */
export function resolveAdminListQuery(
  basePath: string,
  raw: RawSearchParams,
  spec: AdminListSpec,
): { query: AdminListQuery; redirectTo: string | null } {
  const query = parseAdminListQuery(raw, spec);
  const canonical = buildAdminListHref(basePath, query, spec);
  const canonicalParams = Object.fromEntries(new URL(canonical, "http://admin.local").searchParams);
  const requested = pickListParams(raw, spec);
  if (requested !== null && sameParams(requested, canonicalParams)) return { query, redirectTo: null };

  const notice = parseAdminNotice(raw);
  return { query, redirectTo: notice ? appendAdminNotice(canonical, notice) : canonical };
}
