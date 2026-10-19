/**
 * Compose l'URL d'un média à partir de sa base (`buildMediaBaseUrl`) et d'un nom de fichier encodé. `null` si le nom est
 * vide. Sans `server-only` : l'aperçu du logo (Client Component) l'utilise sans dupliquer la règle d'encodage.
 */
export function joinMediaUrl(baseUrl: string, file: string | null | undefined): string | null {
  if (!file || file.trim() === "") return null;
  return `${baseUrl}${encodeURIComponent(file.trim())}`;
}
