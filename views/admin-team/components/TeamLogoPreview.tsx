"use client";

import Image from "next/image";
import { useState } from "react";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { joinMediaUrl } from "@/lib/joinMediaUrl";
import { isValidLogoFileName } from "@/models/isValidLogoFileName";

type TeamLogoPreviewProps = {
  /** Valeur du champ « Logo » (déjà rognée). */
  file: string;
  /** Nom de l'équipe, pour les initiales de repli. */
  name: string;
  /** Dossier des logos sur le back (`buildMediaBaseUrl("logo")`). */
  baseUrl: string;
};

/**
 * Aperçu du logo saisi : chargé directement depuis l'API (`unoptimized`, pas de passage par l'optimiseur qui masquerait
 * le 404). Champ vide ou nom invalide : initiales et aucune requête. Fichier introuvable : initiales et avertissement
 * non bloquant. Un changement de fichier réinitialise l'état d'erreur.
 */
export function TeamLogoPreview({ file, name, baseUrl }: TeamLogoPreviewProps) {
  const url = file !== "" && isValidLogoFileName(file) ? joinMediaUrl(baseUrl, file) : null;
  const [failedFile, setFailedFile] = useState<string | null>(null);
  const failed = url !== null && failedFile === file;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 rounded-lg border-2 border-rpb-ink/14 p-3">
        {url && !failed ? (
          <span className="flex size-16 shrink-0 items-center justify-center">
            <Image
              key={file}
              unoptimized
              src={url}
              width={64}
              height={64}
              alt="Aperçu du logo"
              className="size-full object-contain"
              onError={() => setFailedFile(file)}
              ref={(image) => {
                // L'erreur a pu survenir avant l'hydratation : l'événement `error` est alors perdu.
                if (image?.complete && image.naturalWidth === 0) setFailedFile(file);
              }}
            />
          </span>
        ) : (
          <TeamLogo name={name} logoUrl={null} isRpb={false} context="preview" decorative />
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px]/4 font-semibold tracking-[.08em] text-rpb-ink/72 uppercase">Aperçu</span>
          {file === "" && <span className="text-sm/5 text-rpb-ink/72">Aucun logo</span>}
        </div>
      </div>
      <div role="status">
        {failed && (
          <SummaryNotice
            tone="light"
            icon="alert"
            message="Aucun fichier de ce nom sur le serveur : le logo sera remplacé par des initiales."
          />
        )}
      </div>
    </div>
  );
}
