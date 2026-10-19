import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { animationDelay } from "@/lib/animationDelay";
import { ADMIN_SECTIONS, type AdminEntity } from "@/models/AdminEntity";
import { buildAdminHref } from "@/models/buildAdminHref";

type AdminHubCardProps = {
  entity: AdminEntity;
  /** Rang dans la grille, pour l'entrée en cascade (80 + 40 × rang ms). */
  index: number;
};

/** Carte d'une rubrique sur l'accueil de l'administration : toute la carte est cliquable. */
export function AdminHubCard({ entity, index }: AdminHubCardProps) {
  const section = ADMIN_SECTIONS.find((candidate) => candidate.entity === entity);
  if (!section) return null;

  return (
    <div
      className="reveal lift relative flex flex-col gap-1.5 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-5 shadow-card hover:border-rpb-ink hover:bg-rpb-gold-light"
      style={animationDelay(80 + 40 * index)}
    >
      <Link
        href={buildAdminHref(entity)}
        className="stretched-link flex items-center justify-between gap-2 font-display text-xl/[1.2] font-extrabold text-rpb-ink no-underline"
      >
        {section.label}
        <ChevronRightIcon size={20} strokeWidth={2.5} className="chev shrink-0" />
      </Link>
      <p className="text-sm/5 text-rpb-ink/72">{section.description}</p>
    </div>
  );
}
