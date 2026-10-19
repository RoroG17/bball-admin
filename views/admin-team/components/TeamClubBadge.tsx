import { HouseIcon } from "@/components/ui/icons/HouseIcon";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import type { Season } from "@/models/Season";
import { pluralize } from "@/lib/format";

type TeamClubBadgeProps = {
  /** `null` : saisons illisibles, indicateur indisponible. */
  seasons: readonly Season[] | null;
};

const PILL = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[13px]/5 font-bold whitespace-nowrap";

/** « Équipe du club » (icône + texte), « Autre équipe », ou « — » si l'information n'est pas disponible. */
export function TeamClubBadge({ seasons }: TeamClubBadgeProps) {
  if (seasons === null) {
    return (
      <span>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Indisponible</span>
      </span>
    );
  }
  if (seasons.length === 0) {
    return <span className={`${PILL} border-2 border-rpb-ink/30 py-px text-rpb-ink`}>Autre équipe</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1" title={seasons.map(formatSeasonLabel).join(" ; ")}>
      <span className={`${PILL} bg-rpb-bordeaux text-rpb-gold`}>
        <HouseIcon size={16} strokeWidth={2.2} />
        Équipe du club
      </span>
      <span className="text-[13px] text-rpb-ink/72">· {pluralize(seasons.length, "saison", "saisons")}</span>
    </span>
  );
}
