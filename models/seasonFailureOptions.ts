import type { MapWriteFailureOptions } from "@/models/mapWriteFailure";
import { SEASON_FIELD_MAP, type SeasonField } from "@/models/SeasonInput";
import { SEASON_MESSAGES } from "@/models/seasonMessages";

/** Conversion des 422 du back en erreurs de champ françaises ; un 404 de `PUT` = saison disparue. */
export const SEASON_FAILURE_OPTIONS: MapWriteFailureOptions<SeasonField> = {
  fieldMap: SEASON_FIELD_MAP,
  fieldMessages: { teamId: { unknownReference: SEASON_MESSAGES.teamGone } },
  notFoundMessage: SEASON_MESSAGES.seasonGone,
};
