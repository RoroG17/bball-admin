import type { Season } from "@/models/Season";

export type SeasonTeamCellData =
  | { kind: "named"; name: string; logoUrl: string | null }
  /** `teamId` nul : équipe RPB non renseignée. */
  | { kind: "none" }
  /** `teamId` présent mais absent de la liste (défensif). */
  | { kind: "unknown"; id: number }
  /** Liste des équipes illisible : repli sur l'identifiant. */
  | { kind: "unavailable"; id: number };

export type SeasonRow = { season: Season; label: string; team: SeasonTeamCellData; isMostRecent: boolean };
