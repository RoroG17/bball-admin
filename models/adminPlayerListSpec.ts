import type { AdminListSpec } from "@/models/AdminListQuery";

/** Pas de pagination (D-P10) : la vue force `page = 1`. */
export const PLAYER_LIST_SPEC: AdminListSpec = {
  sortable: ["nom", "licence", "equipe", "naissance"],
  defaultSort: { column: "nom", direction: "asc" },
  filters: ["equipe"],
};

export const PLAYER_TEAM_PLACEHOLDER = "Toutes les équipes";
