import { compareText } from "@/models/compareText";
import type { Season } from "@/models/Season";
import type { Team } from "@/models/Team";

/**
 * Équipes déjà référencées par au moins une saison d'abord (ce sont celles du club), puis les autres ; chaque groupe
 * trié par nom. Le back n'a pas de notion « club » (B-SAI-3) : l'ordre atténue le risque de choisir un adversaire.
 */
export function orderTeamsForSeason(teams: readonly Team[], seasons: readonly Season[]): Team[] {
  const used = new Set(seasons.map((season) => season.teamId));
  const byName = (a: Team, b: Team) => compareText(a.name, b.name) || a.id - b.id;
  return [
    ...teams.filter((team) => used.has(team.id)).sort(byName),
    ...teams.filter((team) => !used.has(team.id)).sort(byName),
  ];
}
