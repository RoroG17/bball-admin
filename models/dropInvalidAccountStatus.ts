import type { RawSearchParams } from "@/models/AdminListQuery";
import { ACCOUNT_STATUS_FILTERS } from "@/models/AccountListSpec";

/** Retire `statut` s'il n'est pas dans `ACCOUNT_STATUS_FILTERS` : `resolveAdminListQuery` redirige alors vers la forme canonique (K8). */
export function dropInvalidAccountStatus(raw: RawSearchParams): RawSearchParams {
  const value = raw.statut;
  if (value === undefined) return raw;
  const first = Array.isArray(value) ? value[0] : value;
  if (first !== undefined && (ACCOUNT_STATUS_FILTERS as readonly string[]).includes(first)) return raw;
  return Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "statut"));
}
