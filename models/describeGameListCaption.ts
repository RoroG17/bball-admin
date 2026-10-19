import { pluralize } from "@/lib/format";
import type { SortState } from "@/models/AdminListQuery";

const SORT_PHRASES: Record<string, { asc: string; desc: string }> = {
  date: {
    asc: "triés par date, du plus ancien au plus récent",
    desc: "triés par date, du plus récent au plus ancien",
  },
  round: {
    asc: "triés par journée, de la première à la dernière",
    desc: "triés par journée, de la dernière à la première",
  },
};

/** Légende du tableau, qui sert aussi de compteur : « 3 matchs sur 18 · triés par date… ». */
export function describeGameListCaption(seasonLabel: string, shown: number, total: number, sort: SortState): string {
  const count = pluralize(shown, "match", "matchs");
  const counter = shown === total ? count : `${count} sur ${total}`;
  const phrase = SORT_PHRASES[sort.column]?.[sort.direction];
  return `Matchs de la saison ${seasonLabel} · ${phrase ? `${counter} · ${phrase}` : counter}`;
}
