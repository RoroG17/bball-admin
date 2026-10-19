import type { Player } from "@/models/Player";

export type UnrankedEntry = { player: Player; value: number };

const COLLATOR = new Intl.Collator("fr", { sensitivity: "base" });

/**
 * Tri déterministe : valeur décroissante, puis nom, prénom, licence. Le résultat ne dépend jamais de l'ordre
 * d'arrivée des données (la V1 départageait les ex æquo au hasard).
 */
export function compareHallOfFameEntries(a: UnrankedEntry, b: UnrankedEntry): number {
  return (
    b.value - a.value ||
    COLLATOR.compare(a.player.lastName, b.player.lastName) ||
    COLLATOR.compare(a.player.firstName, b.player.firstName) ||
    (a.player.licence < b.player.licence ? -1 : a.player.licence > b.player.licence ? 1 : 0)
  );
}
