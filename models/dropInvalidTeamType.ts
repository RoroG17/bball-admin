import type { RawSearchParams } from "@/models/AdminListQuery";
import { TEAM_TYPES } from "@/models/teamList";

/**
 * Retire `type` s'il n'est pas dans `TEAM_TYPES` : `resolveAdminListQuery` redirige alors vers l'URL canonique (la
 * validation des valeurs de filtre appartient à la feature). Un tableau dont le premier élément est valide est conservé
 * tel quel (la résolution le canonise).
 */
export function dropInvalidTeamType(raw: RawSearchParams): RawSearchParams {
  const value = raw.type;
  if (value === undefined) return raw;
  const first = Array.isArray(value) ? value[0] : value;
  if (first !== undefined && (TEAM_TYPES as readonly string[]).includes(first)) return raw;
  return Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "type"));
}
