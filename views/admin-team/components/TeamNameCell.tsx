import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { TeamListRow } from "@/models/TeamListRow";

type TeamNameCellProps = {
  row: TeamListRow;
  /** Équipe qui vient d'être créée ou modifiée : pastille « Vient d'être enregistrée » (le sens passe par le texte). */
  highlighted: boolean;
};

export function TeamNameCell({ row, highlighted }: TeamNameCellProps) {
  const { team, clubSeasons } = row;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <TeamLogo
        name={team.name}
        logoUrl={team.logoUrl}
        isRpb={clubSeasons !== null && clubSeasons.length > 0}
        context="list"
        decorative
      />
      <div className="flex max-w-[300px] min-w-0 flex-col items-start gap-1 @max-[520px]/tbl:max-w-[120px]">
        <span className="text-[15px]/[22px] font-bold wrap-anywhere">{team.name}</span>
        {highlighted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rpb-ink px-[9px] py-px text-xs font-bold text-rpb-gold">
            <CheckIcon size={14} strokeWidth={3} />
            Vient d&apos;être enregistrée
          </span>
        )}
      </div>
    </div>
  );
}
