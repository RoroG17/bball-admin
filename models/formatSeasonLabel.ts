import type { Season } from "@/models/Season";

/** `"2024-2025 · Régional 2 · U17"`. Un segment vide est omis. */
export function formatSeasonLabel(season: Season): string {
  return [`${season.startYear}-${season.endYear}`, season.championship.trim(), season.category.trim()]
    .filter((segment) => segment !== "")
    .join(" · ");
}
