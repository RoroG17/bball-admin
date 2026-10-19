import type { RpbTeam } from "@/models/RpbTeam";

export type RpbTeamResolution =
  | { kind: "resolved"; team: RpbTeam }
  /** Saison sans équipe associée, ou équipe introuvable (404). */
  | { kind: "notConfigured" }
  /** Erreur réseau, API ou format en chargeant l'équipe. */
  | { kind: "unavailable" };
