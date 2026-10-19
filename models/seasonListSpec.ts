import type { AdminListSpec } from "@/models/AdminListQuery";

export const SEASON_LIST_SPEC: AdminListSpec = {
  sortable: ["year", "championship", "category", "team"],
  defaultSort: { column: "year", direction: "desc" },
  filters: [],
};

/** Recherche de candidats de l'écran de modification : seulement `?q=`. */
export const PARTICIPANT_SEARCH_SPEC: AdminListSpec = {
  sortable: [],
  defaultSort: { column: "name", direction: "asc" },
  filters: [],
};
