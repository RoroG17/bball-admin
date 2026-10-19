import type { Team } from "@/models/Team";

/** Équipes lues pour la liste des saisons, ou indisponibles (la liste reste utilisable, D-S12). */
export type TeamsResolution = { kind: "loaded"; teams: readonly Team[] } | { kind: "unavailable" };
