import type { AdminPlayer } from "@/models/AdminPlayer";
import { filterPlayersByName } from "@/models/filterPlayersByName";
import { normalizeSearchText } from "@/models/normalizeSearchText";

type PlayerCriteria = { q: string; teamId: number | null };

/**
 * Filtre d'équipe (égalité exacte) puis recherche : tous les mots dans « prénom nom » (sans accents ni casse), OU la
 * licence contient la recherche (D-P13). Ordre conservé, copie.
 */
export function filterAdminPlayers(rows: readonly AdminPlayer[], { q, teamId }: PlayerCriteria): AdminPlayer[] {
  const inTeam = teamId === null ? [...rows] : rows.filter((row) => row.team.id === teamId);
  const needle = normalizeSearchText(q);
  if (needle === "") return inTeam;
  const byName = new Set(filterPlayersByName(inTeam, q));
  return inTeam.filter((row) => byName.has(row) || normalizeSearchText(row.player.licence).includes(needle));
}
