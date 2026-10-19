export type AdminEntity = "player" | "team" | "season" | "game" | "user" | "logs";

export type AdminSection = { entity: AdminEntity; label: string; description: string };

/** Rubriques de l'administration, dans l'ordre fixe de la navigation. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { entity: "player", label: "Joueurs", description: "Fiches des joueurs, équipe et compte lié." },
  { entity: "team", label: "Équipes", description: "Les équipes du club et leurs adversaires." },
  { entity: "season", label: "Saisons", description: "Saisons, équipe du club et participants." },
  { entity: "game", label: "Matchs", description: "Calendrier, scores et équipes du match." },
  { entity: "user", label: "Utilisateurs", description: "Comptes de connexion et mots de passe." },
  { entity: "logs", label: "Journaux", description: "Erreurs enregistrées par l'API, en lecture seule." },
];

/** Nom et genre de chaque entité, pour accorder les messages (« créé » / « créée »). */
export const ADMIN_ENTITY_NOUNS: Record<AdminEntity, { singular: string; gender: "m" | "f" }> = {
  player: { singular: "joueur", gender: "m" },
  team: { singular: "équipe", gender: "f" },
  season: { singular: "saison", gender: "f" },
  game: { singular: "match", gender: "m" },
  user: { singular: "compte", gender: "m" },
  logs: { singular: "journal", gender: "m" },
};
