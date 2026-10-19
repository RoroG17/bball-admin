import type { Team } from "@/models/Team";

/** Valeur de la liste d'équipes : l'équipe de la saison si elle existe, sinon `""` (option vide, jamais la première équipe). */
export function resolveSeasonTeamValue(teamId: number | null, teams: readonly Team[]): string {
  return teamId !== null && teams.some((team) => team.id === teamId) ? String(teamId) : "";
}
