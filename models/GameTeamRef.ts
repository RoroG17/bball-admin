/** Vue minimale d'un match : le back n'expose que les NOMS des équipes (B-T2), pas leurs identifiants. */
export type GameTeamRef = { gameId: number; seasonId: number; homeName: string; awayName: string };
