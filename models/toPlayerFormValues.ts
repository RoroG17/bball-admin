import type { AdminPlayer } from "@/models/AdminPlayer";
import type { FormValues } from "@/models/FormState";
import { parseCivility } from "@/models/parseCivility";
import type { PlayerField } from "@/models/PlayerInput";

export const EMPTY_PLAYER_VALUES: FormValues<PlayerField> = {
  licence: "",
  lastName: "",
  firstName: "",
  civility: "",
  birthDate: "",
  photo: "",
  teamId: "",
};

/** Valeurs initiales du formulaire de modification. Civilité non reconnue → `""` (à re-choisir, D-P6). */
export function toPlayerFormValues(player: AdminPlayer): FormValues<PlayerField> {
  return {
    licence: player.player.licence,
    lastName: player.player.lastName,
    firstName: player.player.firstName,
    civility: parseCivility(player.personalInfo.civility) ?? "",
    birthDate: player.personalInfo.birthDate,
    photo: player.photoFile ?? "",
    teamId: String(player.team.id),
  };
}
