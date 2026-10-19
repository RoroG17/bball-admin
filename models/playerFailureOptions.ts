import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import type { MapWriteFailureOptions } from "@/models/mapWriteFailure";
import type { PlayerField } from "@/models/PlayerInput";

/** `equipe` (POST) et `Id_Equipe` (PUT) désignent le même champ ; `licence.taken` a son texte propre. */
export const PLAYER_FAILURE_OPTIONS: MapWriteFailureOptions<PlayerField> = {
  fieldMap: {
    licence: "licence",
    nom: "lastName",
    prenom: "firstName",
    civilite: "civility",
    date_naissance: "birthDate",
    photo: "photo",
    equipe: "teamId",
    Id_Equipe: "teamId",
  },
  fieldMessages: {
    licence: { taken: ADMIN_PLAYER_MESSAGES.licenceTaken },
    teamId: { unknownReference: ADMIN_PLAYER_MESSAGES.teamUnknown, required: ADMIN_PLAYER_MESSAGES.teamRequired },
  },
  notFoundMessage: ADMIN_PLAYER_MESSAGES.playerGone,
};
