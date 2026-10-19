import { AdminSelectField } from "@/components/admin/AdminSelectField";
import { AdminTextField } from "@/components/admin/AdminTextField";
import type { FormValues } from "@/models/FormState";
import { SEASON_TEXT_MAX, type SeasonField } from "@/models/SeasonInput";
import { SEASON_MESSAGES } from "@/models/seasonMessages";

type SeasonFormFieldsProps = {
  initial: FormValues<SeasonField>;
  /** Options de l'équipe, déjà ordonnées (`orderTeamsForSeason`). */
  teamOptions: readonly { value: string; label: string }[];
  /** Indice permanent sous la liste d'équipes. */
  teamHint: string;
};

/** Champs de la saison, communs à la création et à la modification (une seule source). */
export function SeasonFormFields({ initial, teamOptions, teamHint }: SeasonFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-5">
        <AdminTextField
          name="startYear"
          label="Année de début"
          defaultValue={initial.startYear}
          required
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
        />
        <AdminTextField
          name="endYear"
          label="Année de fin"
          defaultValue={initial.endYear}
          required
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
        />
      </div>
      <AdminTextField
        name="championship"
        label="Championnat"
        defaultValue={initial.championship}
        required
        maxLength={SEASON_TEXT_MAX}
        autoComplete="off"
      />
      <AdminTextField
        name="category"
        label="Catégorie"
        defaultValue={initial.category}
        required
        maxLength={SEASON_TEXT_MAX}
        autoComplete="off"
      />
      <AdminSelectField
        name="teamId"
        label="Équipe RPB"
        defaultValue={initial.teamId}
        options={teamOptions}
        placeholder={SEASON_MESSAGES.teamPlaceholder}
        required
        hint={teamHint}
      />
    </>
  );
}
