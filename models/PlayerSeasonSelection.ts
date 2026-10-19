import type { Season } from "@/models/Season";

/** Valeur de `?saison=` pour toutes les saisons du joueur. */
export const CAREER_PARAM = "carriere";

export type PlayerSeasonSelection = { kind: "season"; season: Season } | { kind: "career" };
