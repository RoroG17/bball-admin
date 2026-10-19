"use client";

import Image from "next/image";
import { useState } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import type { Player } from "@/models/Player";
import type { PhotoPreview } from "@/models/resolvePhotoPreview";

type PlayerPhotoPreviewProps = {
  preview: PhotoPreview;
  /** Prénom et nom pour les initiales de repli. */
  player: Pick<Player, "firstName" | "lastName">;
};

type LoadResult = { url: string; status: "loaded" | "missing" };

/**
 * Aperçu de la photo saisie, avec ses états annoncés (`role="status"`) : aucune photo, nom refusé, chargement, chargée,
 * introuvable. Chargée directement depuis l'API (`unoptimized` : l'optimiseur masquerait le 404). Le sens ne passe jamais
 * par la couleur seule. Un autre fichier réinitialise l'état (le résultat est lié à son URL).
 */
export function PlayerPhotoPreview({ preview, player }: PlayerPhotoPreviewProps) {
  const [result, setResult] = useState<LoadResult | null>(null);
  // Même résultat = même objet : le `ref` ci-dessous est rappelé à chaque rendu, il ne doit pas relancer un rendu.
  const record = (url: string, outcome: LoadResult["status"]) =>
    setResult((current) => (current?.url === url && current.status === outcome ? current : { url, status: outcome }));
  const status =
    preview.kind === "url" ? (result?.url === preview.url ? result.status : "loading") : preview.kind;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 rounded-lg border-2 border-rpb-ink/14 p-3">
        {preview.kind === "url" && status !== "missing" ? (
          <span className="relative flex size-20 shrink-0 overflow-hidden rounded-full bg-rpb-gold-light">
            <Image
              key={preview.url}
              unoptimized
              src={preview.url}
              width={80}
              height={80}
              alt=""
              className="size-full object-cover"
              onLoad={() => record(preview.url, "loaded")}
              onError={() => record(preview.url, "missing")}
              ref={(image) => {
                // Le chargement a pu se terminer avant l'hydratation : les événements `load` / `error` sont alors perdus.
                if (image?.complete) record(preview.url, image.naturalWidth === 0 ? "missing" : "loaded");
              }}
            />
          </span>
        ) : (
          <PlayerAvatar player={{ ...player, photoUrl: null }} size="2xl" decorative />
        )}
        <span className="text-[11px]/4 font-semibold tracking-[.08em] text-rpb-ink/72 uppercase">Aperçu</span>
      </div>
      <div role="status" aria-live="polite">
        {status === "none" && <p className="text-sm text-rpb-ink/72">Aucune photo : les initiales seront affichées.</p>}
        {status === "invalid" && (
          <SummaryNotice
            tone="light"
            icon="alert"
            message="Nom de fichier non valide (vérifie l'extension et les « / »)."
          />
        )}
        {status === "loading" && <p className="text-sm text-rpb-ink/72">Chargement de l&apos;aperçu…</p>}
        {status === "loaded" && preview.kind === "url" && (
          <p className="text-sm text-rpb-ink/72">{`Aperçu de la photo « ${preview.fileName} ».`}</p>
        )}
        {status === "missing" && (
          <SummaryNotice
            tone="light"
            icon="alert"
            message="Image introuvable sur le serveur : vérifie le nom (majuscules, extension) et que le fichier a bien été déposé."
          />
        )}
      </div>
    </div>
  );
}
