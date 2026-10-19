import type { Season } from "@/models/Season";

/** Valeur de `?saison=` pour la liste complète (admin seulement). */
export const ALL_PLAYERS_PARAM = "tous";

export type PlayerListScope = { kind: "season"; season: Season } | { kind: "all" };
