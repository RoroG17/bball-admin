import { AdminTextField } from "@/components/admin/AdminTextField";
import { TEAM_NAME_MAX_LENGTH } from "@/models/Team";
import { TeamLogoField } from "@/views/admin-team/components/TeamLogoField";

type TeamFormFieldsProps = {
  defaults: { name: string; logo: string };
  previewName: string;
  logoBaseUrl: string;
};

/** Champs de l'équipe, communs à la création et à la modification (une seule source). */
export function TeamFormFields({ defaults, previewName, logoBaseUrl }: TeamFormFieldsProps) {
  return (
    <>
      <AdminTextField
        name="name"
        label="Nom de l'équipe"
        defaultValue={defaults.name}
        required
        maxLength={TEAM_NAME_MAX_LENGTH}
        autoComplete="off"
      />
      <TeamLogoField defaultValue={defaults.logo} previewName={previewName} logoBaseUrl={logoBaseUrl} />
    </>
  );
}
