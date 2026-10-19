import type { RawSearchParams } from "@/models/AdminListQuery";
import { parseTeamFilter } from "@/models/parseTeamFilter";

/**
 * Retire `equipe` s'il n'est pas un identifiant valide : la vue redirige alors vers l'URL canonique (la validation des
 * valeurs de filtre appartient à la feature, K8). Un tableau dont le premier élément est valide est conservé tel quel.
 */
export function dropInvalidPlayerTeam(raw: RawSearchParams): RawSearchParams {
  const value = raw.equipe;
  if (value === undefined) return raw;
  const first = Array.isArray(value) ? value[0] : value;
  if (parseTeamFilter(first) !== null) return raw;
  return Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "equipe"));
}
