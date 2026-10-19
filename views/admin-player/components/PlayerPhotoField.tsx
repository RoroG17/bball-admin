"use client";

import { useState, type FocusEvent } from "react";
import { useAdminFormContext } from "@/components/admin/adminFormContext";
import { AdminTextField } from "@/components/admin/AdminTextField";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { resolvePhotoPreview } from "@/models/resolvePhotoPreview";
import { PlayerPhotoPreview } from "@/views/admin-player/components/PlayerPhotoPreview";

type PlayerPhotoFieldProps = {
  defaultValue: string;
  /** Dossier des photos sur le back (`buildMediaBaseUrl("joueur")`). */
  baseUrl: string;
  /** Prénom et nom connus au chargement, pour les initiales tant que les champs n'ont pas été lus. */
  initialName: { firstName: string; lastName: string };
};

/**
 * Champ « Photo » et son aperçu. L'aperçu ne change qu'à la perte de focus du champ (pas à chaque frappe : aucune requête
 * en rafale). Ne bloque jamais la soumission. Isolé ici pour accueillir demain un envoi de fichier.
 */
export function PlayerPhotoField({ defaultValue, baseUrl, initialName }: PlayerPhotoFieldProps) {
  const form = useAdminFormContext();
  const returned = form?.state.status === "error" ? form.state.values.photo : undefined;
  const [committed, setCommitted] = useState(returned ?? defaultValue);
  const [name, setName] = useState(initialName);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "photo") return;
    setCommitted(input.value);
    const read = (field: string) => {
      const element = input.form?.elements.namedItem(field);
      return element instanceof HTMLInputElement ? element.value : "";
    };
    setName({ firstName: read("firstName"), lastName: read("lastName") });
  }

  return (
    <div onBlur={handleBlur} className="flex flex-col gap-3">
      <AdminTextField
        name="photo"
        label="Photo (nom du fichier)"
        defaultValue={defaultValue}
        maxLength={255}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        hint={ADMIN_PLAYER_MESSAGES.photoHint}
      />
      <PlayerPhotoPreview preview={resolvePhotoPreview(baseUrl, committed)} player={name} />
    </div>
  );
}
