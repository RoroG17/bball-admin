import type { Player } from "@/models/Player";

const collator = new Intl.Collator("fr", { sensitivity: "base" });

/** Tri par nom puis prénom, selon l'ordre alphabétique français. Ne mute pas l'entrée. */
export function sortPlayersByName<T extends Pick<Player, "firstName" | "lastName">>(players: readonly T[]): T[] {
  return [...players].sort(
    (a, b) => collator.compare(a.lastName, b.lastName) || collator.compare(a.firstName, b.firstName),
  );
}
