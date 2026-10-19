import { ADMIN_LIST_SEARCH_MAX_LENGTH, type RawSearchParams } from "@/models/AdminListQuery";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** `?q=` (rognée, 100 caractères) et `?joueur=` (licence valide, sinon `null`) du sélecteur de joueur. Autres clés ignorées. */
export function parseAccountCreateParams(raw: RawSearchParams): { q: string; licence: string | null } {
  return {
    q: first(raw.q).trim().slice(0, ADMIN_LIST_SEARCH_MAX_LENGTH),
    licence: parsePlayerLicence(first(raw.joueur)),
  };
}
