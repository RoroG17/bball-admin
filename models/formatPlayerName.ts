import type { Player } from "@/models/Player";

/** `"Prénom Nom"`. */
export function formatPlayerName({ firstName, lastName }: Pick<Player, "firstName" | "lastName">): string {
  return [firstName.trim(), lastName.trim()].filter((part) => part !== "").join(" ");
}
