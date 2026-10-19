import { ADMIN_MESSAGES } from "@/models/adminMessages";
import type { MapWriteFailureOptions } from "@/models/mapWriteFailure";
import type { TeamField } from "@/models/TeamInput";

/** Le back n'a ni unicité ni `max` : seuls `nom` et `logo` existent comme champs, sans message propre. */
export const TEAM_FAILURE_OPTIONS: MapWriteFailureOptions<TeamField> = {
  fieldMap: { nom: "name", logo: "logo" },
  fieldMessages: {},
  notFoundMessage: ADMIN_MESSAGES.gone,
};
