import { normalizeSearchText } from "@/models/normalizeSearchText";
import type { PlayerListEntry } from "@/models/PlayerListEntry";

/**
 * Chaque mot de la recherche doit apparaître dans « prénom nom », sans tenir compte des accents ni de la casse :
 * « dur pa » trouve « Paul Durand ». Recherche vide : tout. Ordre conservé. Générique : tout objet qui étend une
 * entrée de liste (ex. `AdminPlayer`) revient avec son type.
 */
export function filterPlayersByName<T extends PlayerListEntry>(entries: readonly T[], query: string): T[] {
  const words = normalizeSearchText(query)
    .split(" ")
    .filter((word) => word !== "");
  if (words.length === 0) return [...entries];
  return entries.filter(({ player }) => {
    const haystack = normalizeSearchText(`${player.firstName} ${player.lastName}`);
    return words.every((word) => haystack.includes(word));
  });
}
