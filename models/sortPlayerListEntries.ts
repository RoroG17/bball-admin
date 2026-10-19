import type { PlayerListEntry } from "@/models/PlayerListEntry";

const collator = new Intl.Collator("fr", { sensitivity: "base" });

/** Même ordre que `sortPlayersByName` (nom puis prénom, alphabet français), sur les cartes de la liste. Ne mute pas. */
export function sortPlayerListEntries(entries: readonly PlayerListEntry[]): PlayerListEntry[] {
  return [...entries].sort(
    (a, b) =>
      collator.compare(a.player.lastName, b.player.lastName) || collator.compare(a.player.firstName, b.player.firstName),
  );
}
