import type { Player } from "@/models/Player";

/** `"Jean Dupont"` → `"JD"`, `"Jean-Marc Dupont"` → `"JD"`. `"?"` si les deux noms sont vides. */
export function getPlayerInitials({ firstName, lastName }: Pick<Player, "firstName" | "lastName">): string {
  const initials = [firstName, lastName]
    .map((part) => part.trim().charAt(0))
    .join("")
    .toLocaleUpperCase("fr-FR");
  return initials === "" ? "?" : initials;
}
