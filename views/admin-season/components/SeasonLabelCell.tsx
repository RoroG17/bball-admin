import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import type { SeasonRow } from "@/models/SeasonRow";
import { SeasonRecencyBadge } from "@/views/admin-season/components/SeasonRecencyBadge";

type SeasonLabelCellProps = {
  row: SeasonRow;
  /** Saison qui vient d'être créée ou modifiée : pastille « Vient d'être enregistrée » (le sens passe par le texte). */
  highlighted: boolean;
};

/** Années de la saison, badge « Plus récente » et pastille d'enregistrement. */
export function SeasonLabelCell({ row, highlighted }: SeasonLabelCellProps) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <span className="text-[15px]/[22px] font-bold tabular-nums">
        {row.season.startYear}-{row.season.endYear}
      </span>
      {row.isMostRecent && <SeasonRecencyBadge />}
      {highlighted && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rpb-ink px-[9px] py-px text-xs font-bold text-rpb-gold">
          <CheckIcon size={14} strokeWidth={3} />
          Vient d&apos;être enregistrée
        </span>
      )}
    </div>
  );
}
