import type { AdminListSpec } from "@/models/AdminListQuery";

export const GAME_LIST_BASE_PATH = "/admin/game";

/** Liste d'une saison à la fois (`?saison=`, D-G1), triée par date puis journée. */
export const GAME_LIST_SPEC: AdminListSpec = {
  sortable: ["date", "round"],
  defaultSort: { column: "date", direction: "asc" },
  filters: ["saison"],
};
