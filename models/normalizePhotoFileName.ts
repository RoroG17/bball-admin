export type PhotoFileName = { kind: "none" } | { kind: "invalid" } | { kind: "ok"; fileName: string };

const IMAGE_EXTENSION = /\.(png|jpe?g|webp|gif)$/i;

/** Séparateurs de dossier et caractères de contrôle (code < 32 ou DEL). */
function hasForbiddenCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return character === "/" || character === "\\" || code < 32 || code === 127;
  });
}

/**
 * Nom de fichier de la photo : vide → `none` ; plus de 255 caractères, `/`, `\`, caractère de contrôle ou extension non
 * image → `invalid` ; sinon le nom tel que saisi (casse conservée : le serveur de fichiers y est sensible).
 */
export function normalizePhotoFileName(raw: string): PhotoFileName {
  const fileName = raw.trim();
  if (fileName === "") return { kind: "none" };
  if (fileName.length > 255 || hasForbiddenCharacter(fileName) || !IMAGE_EXTENSION.test(fileName)) {
    return { kind: "invalid" };
  }
  return { kind: "ok", fileName };
}
