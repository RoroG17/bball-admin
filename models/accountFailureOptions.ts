import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import type { AccountField } from "@/models/AccountInput";
import type { MapWriteFailureOptions } from "@/models/mapWriteFailure";

/** Seul champ du back mappé : `username`. Une erreur sur `joueur` devient le message générique de `mapWriteFailure`. */
export const ACCOUNT_FAILURE_OPTIONS: MapWriteFailureOptions<AccountField> = {
  fieldMap: { username: "username" },
  fieldMessages: {
    username: {
      taken: ACCOUNT_MESSAGES.username.taken,
      required: ACCOUNT_MESSAGES.username.required,
      tooLong: ACCOUNT_MESSAGES.username.tooLong,
    },
  },
  notFoundMessage: ACCOUNT_MESSAGES.gone,
};
