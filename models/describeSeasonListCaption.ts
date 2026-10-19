import { pluralize } from "@/lib/format";
import type { SortState } from "@/models/AdminListQuery";

const SORT_PHRASES: Record<string, { asc: string; desc: string }> = {
  year: {
    asc: "triées par année, de la plus ancienne à la plus récente",
    desc: "triées par année, de la plus récente à la plus ancienne",
  },
  championship: { asc: "triées par championnat, de A à Z", desc: "triées par championnat, de Z à A" },
  category: { asc: "triées par catégorie, de A à Z", desc: "triées par catégorie, de Z à A" },
  team: { asc: "triées par équipe, de A à Z", desc: "triées par équipe, de Z à A" },
};

/** Légende du tableau, qui sert aussi de compteur : « 3 saisons sur 12 · triées par année… ». */
export function describeSeasonListCaption(shown: number, total: number, sort: SortState): string {
  const count = pluralize(shown, "saison", "saisons");
  const counter = shown === total ? count : `${count} sur ${total}`;
  const phrase = SORT_PHRASES[sort.column]?.[sort.direction];
  return phrase ? `${counter} · ${phrase}` : counter;
}
