import { pluralize } from "@/lib/format";
import type { SortState } from "@/models/AdminListQuery";

const SORT_PHRASES: Record<string, { asc: string; desc: string }> = {
  name: { asc: "triées par nom, de A à Z", desc: "triées par nom, de Z à A" },
  players: {
    asc: "triées par nombre de joueurs, du plus petit au plus grand",
    desc: "triées par nombre de joueurs, du plus grand au plus petit",
  },
  club: { asc: "triées par type, autres équipes d'abord", desc: "triées par type, équipes du club d'abord" },
};

/** Légende du tableau, qui sert aussi de compteur : « 3 équipes sur 14 · triées par nom, de A à Z ». */
export function describeTeamListCaption(shown: number, total: number, sort: SortState): string {
  const count = pluralize(shown, "équipe", "équipes");
  const counter = shown === total ? count : `${count} sur ${total}`;
  const phrase = SORT_PHRASES[sort.column]?.[sort.direction];
  return phrase ? `${counter} · ${phrase}` : counter;
}
