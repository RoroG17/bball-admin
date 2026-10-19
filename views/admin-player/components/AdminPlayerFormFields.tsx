import { AdminSelectField } from "@/components/admin/AdminSelectField";
import { AdminTextField } from "@/components/admin/AdminTextField";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { CIVILITY_OPTIONS } from "@/models/Civility";
import type { FormValues } from "@/models/FormState";
import {
  PLAYER_BIRTH_DATE_MIN,
  PLAYER_LICENCE_MAX_LENGTH,
  PLAYER_NAME_MAX_LENGTH,
  type PlayerField,
} from "@/models/PlayerInput";
import { PlayerPhotoField } from "@/views/admin-player/components/PlayerPhotoField";

type AdminPlayerFormFieldsProps = {
  mode: "create" | "edit";
  defaults: FormValues<PlayerField>;
  /** Options de l'équipe, déjà triées (`toTeamSelectOptions`). */
  teamOptions: readonly { value: string; label: string }[];
  /** Dossier des photos sur le back (`buildMediaBaseUrl("joueur")`). */
  photoBaseUrl: string;
  /** Date du jour à Paris : borne haute de la date de naissance. */
  today: string;
  /** Indice sous « Civilité » quand la valeur enregistrée n'est pas reconnue (modification). */
  civilityHint?: string;
};

/** Champs du joueur, communs à la création et à la modification (une seule source). */
export function AdminPlayerFormFields({
  mode,
  defaults,
  teamOptions,
  photoBaseUrl,
  today,
  civilityHint,
}: AdminPlayerFormFieldsProps) {
  return (
    <>
      <AdminTextField
        name="licence"
        label="Licence"
        defaultValue={defaults.licence}
        required
        readOnly={mode === "edit"}
        maxLength={PLAYER_LICENCE_MAX_LENGTH}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        hint={mode === "edit" ? ADMIN_PLAYER_MESSAGES.licenceReadOnlyHint : ADMIN_PLAYER_MESSAGES.licenceHint}
      />
      <AdminTextField
        name="lastName"
        label="Nom"
        defaultValue={defaults.lastName}
        required
        maxLength={PLAYER_NAME_MAX_LENGTH}
        autoComplete="off"
      />
      <AdminTextField
        name="firstName"
        label="Prénom"
        defaultValue={defaults.firstName}
        required
        maxLength={PLAYER_NAME_MAX_LENGTH}
        autoComplete="off"
      />
      <AdminSelectField
        name="civility"
        label="Civilité"
        defaultValue={defaults.civility}
        options={CIVILITY_OPTIONS}
        placeholder="Choisis…"
        required
        hint={civilityHint}
      />
      <AdminTextField
        name="birthDate"
        label="Date de naissance"
        type="date"
        defaultValue={defaults.birthDate}
        required
        min={PLAYER_BIRTH_DATE_MIN}
        max={today}
      />
      <AdminSelectField
        name="teamId"
        label="Équipe"
        defaultValue={defaults.teamId}
        options={teamOptions}
        placeholder="Choisis une équipe"
        required
        hint={ADMIN_PLAYER_MESSAGES.teamHint}
      />
      <PlayerPhotoField
        defaultValue={defaults.photo}
        baseUrl={photoBaseUrl}
        initialName={{ firstName: defaults.firstName, lastName: defaults.lastName }}
      />
    </>
  );
}
