/** Saison proposée dans le formulaire d'un match, avec son équipe RPB (données sérialisables vers le Client Component). */
export type GameSeasonOption = {
  id: number;
  label: string;
  rpbTeamId: number | null;
  rpbTeamName: string | null;
};
