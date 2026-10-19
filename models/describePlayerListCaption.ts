import { pluralize } from "@/lib/format";
import type { SortState } from "@/models/AdminListQuery";

const SORT_PHRASES: Record<string, { asc: string; desc: string }> = {
  nom: { asc: "triés par nom, de A à Z", desc: "triés par nom, de Z à A" },
  licence: { asc: "triés par licence, de A à Z", desc: "triés par licence, de Z à A" },
  equipe: { asc: "triés par équipe, de A à Z", desc: "triés par équipe, de Z à A" },
  naissance: {
    asc: "triés par date de naissance, du plus âgé au plus jeune",
    desc: "triés par date de naissance, du plus jeune au plus âgé",
  },
};

/** Légende du tableau, qui sert aussi de compteur : « 3 joueurs sur 18 · triés par nom, de A à Z ». */
export function describePlayerListCaption(shown: number, total: number, sort: SortState): string {
  const count = pluralize(shown, "joueur", "joueurs");
  const counter = shown === total ? count : `${count} sur ${total}`;
  const phrase = SORT_PHRASES[sort.column]?.[sort.direction];
  return phrase ? `${counter} · ${phrase}` : counter;
}
