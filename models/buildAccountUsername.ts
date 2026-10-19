import type { Player } from "@/models/Player";

function slug(part: string): string {
  return part.trim().toLocaleLowerCase("fr-FR").replace(/[\s-]+/g, "_");
}

/**
 * Suggestion d'identifiant, modifiable : minuscules, accents conservés, espaces et tirets internes → `_`, prénom et nom
 * joints par un point. Rognage AVANT le remplacement (pas de `_` initial). Un côté vide : l'autre seul ; deux vides : `""`.
 * Le résultat peut échouer à `validateUsername` (apostrophe…) : l'erreur s'affiche à la soumission.
 */
export function buildAccountUsername(player: Pick<Player, "firstName" | "lastName">): string {
  return [slug(player.firstName), slug(player.lastName)].filter((part) => part !== "").join(".");
}
