import type { RawSearchParams } from "@/models/AdminListQuery";
import { buildAccountCreateHref } from "@/models/buildAccountCreateHref";
import { parseAccountCreateParams } from "@/models/parseAccountCreateParams";

/**
 * Paramètres du sélecteur et redirection éventuelle vers la forme canonique (espaces autour de `q`, licence invalide,
 * tableau, clé inconnue). Sur une URL canonique : `redirectTo` vaut `null` (jamais de boucle).
 */
export function resolveAccountCreateRequest(raw: RawSearchParams): {
  params: { q: string; licence: string | null };
  redirectTo: string | null;
} {
  const params = parseAccountCreateParams(raw);
  const canonical = buildAccountCreateHref(params);
  const expected = Object.fromEntries(new URL(canonical, "http://admin.local").searchParams);
  const requested = Object.entries(raw).filter(([, value]) => value !== undefined);
  const isCanonical =
    requested.length === Object.keys(expected).length &&
    requested.every(([key, value]) => typeof value === "string" && expected[key] === value);
  return { params, redirectTo: isCanonical ? null : canonical };
}
