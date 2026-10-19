import { joinMediaUrl } from "@/lib/joinMediaUrl";
import { normalizePhotoFileName } from "@/models/normalizePhotoFileName";

export type PhotoPreview = { kind: "none" } | { kind: "invalid" } | { kind: "url"; url: string; fileName: string };

/** Aperçu de la photo saisie : rien, nom refusé, ou URL du fichier sur le back (`baseUrl` = `buildMediaBaseUrl("joueur")`). */
export function resolvePhotoPreview(baseUrl: string, raw: string): PhotoPreview {
  const photo = normalizePhotoFileName(raw);
  if (photo.kind !== "ok") return photo;
  const url = joinMediaUrl(baseUrl, photo.fileName);
  return url === null ? { kind: "none" } : { kind: "url", url, fileName: photo.fileName };
}
