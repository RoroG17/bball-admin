import { normalizeSearchText } from "@/models/normalizeSearchText";
import type { Team } from "@/models/Team";

/**
 * Première équipe qui porte déjà ce nom (casse, accents et espaces multiples ignorés). `selfId` : l'équipe modifiée est
 * ignorée, et une édition qui ne change pas le nom normalisé n'est jamais bloquée, même si un doublon préexiste.
 */
export function findTeamNameConflict(teams: readonly Team[], candidate: string, selfId?: number): Team | null {
  const wanted = normalizeSearchText(candidate);
  if (wanted === "") return null;
  if (selfId !== undefined) {
    const self = teams.find((team) => team.id === selfId);
    if (self && normalizeSearchText(self.name) === wanted) return null;
  }
  return teams.find((team) => team.id !== selfId && normalizeSearchText(team.name) === wanted) ?? null;
}
