import type { AdminListSpec } from "@/models/AdminListQuery";

export const TEAM_TYPES = ["club", "other"] as const;
export type TeamType = (typeof TEAM_TYPES)[number];

export const TEAM_TYPE_LABELS: Record<TeamType, string> = { club: "Équipes du club", other: "Autres équipes" };
export const TEAM_TYPE_PLACEHOLDER = "Toutes les équipes";

export const TEAM_LIST_SPEC: AdminListSpec = {
  sortable: ["name", "players", "club"],
  defaultSort: { column: "name", direction: "asc" },
  filters: ["type"],
};
