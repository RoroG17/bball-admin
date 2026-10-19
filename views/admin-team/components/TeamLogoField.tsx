"use client";

import { useState, type FocusEvent } from "react";
import { useAdminFormContext } from "@/components/admin/adminFormContext";
import { AdminTextField } from "@/components/admin/AdminTextField";
import { TeamLogoPreview } from "@/views/admin-team/components/TeamLogoPreview";

type TeamLogoFieldProps = {
  defaultValue: string;
  /** Nom de l'équipe pour les initiales de l'aperçu, tant que le champ « Nom » n'a pas été lu. */
  previewName: string;
  logoBaseUrl: string;
};

const FALLBACK_NAME = "Équipe";

/**
 * Champ « Logo » et son aperçu. L'aperçu ne change qu'à la perte de focus du champ (pas à chaque frappe : pas de
 * requêtes inutiles). Ne bloque jamais la soumission. Isolé ici pour accueillir demain un sélecteur de fichiers.
 */
export function TeamLogoField({ defaultValue, previewName, logoBaseUrl }: TeamLogoFieldProps) {
  const form = useAdminFormContext();
  const returned = form?.state.status === "error" ? form.state.values.logo : undefined;
  const [file, setFile] = useState((returned ?? defaultValue).trim());
  const [name, setName] = useState(previewName);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "logo") return;
    setFile(input.value.trim());
    const nameInput = input.form?.elements.namedItem("name");
    if (nameInput instanceof HTMLInputElement && nameInput.value.trim() !== "") setName(nameInput.value.trim());
  }

  return (
    <div onBlur={handleBlur} className="flex flex-col gap-3">
      <AdminTextField
        name="logo"
        label="Logo (nom de fichier)"
        defaultValue={defaultValue}
        maxLength={255}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        hint="Nom du fichier déjà déposé sur le serveur, par exemple « logo_colomiers.png ». Pour ajouter un nouveau fichier, contacte le responsable technique."
      />
      <TeamLogoPreview file={file} name={name.trim() === "" ? FALLBACK_NAME : name} baseUrl={logoBaseUrl} />
    </div>
  );
}
