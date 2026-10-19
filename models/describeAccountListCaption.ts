import { pluralize } from "@/lib/format";
import type { SortState } from "@/models/AdminListQuery";

const SORT_PHRASES: Record<string, { asc: string; desc: string }> = {
  identifiant: { asc: "triés par identifiant, de A à Z", desc: "triés par identifiant, de Z à A" },
  joueur: { asc: "triés par joueur, de A à Z", desc: "triés par joueur, de Z à A" },
  equipe: { asc: "triés par équipe, de A à Z", desc: "triés par équipe, de Z à A" },
};

/** Légende du tableau, qui sert aussi de compteur : « 3 comptes sur 12 · triés par joueur, de A à Z ». */
export function describeAccountListCaption(shown: number, total: number, sort: SortState): string {
  const count = pluralize(shown, "compte", "comptes");
  const counter = shown === total ? count : `${count} sur ${total}`;
  const phrase = SORT_PHRASES[sort.column]?.[sort.direction];
  return phrase ? `${counter} · ${phrase}` : counter;
}
