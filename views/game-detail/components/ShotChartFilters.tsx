import { useId } from "react";
import { cx } from "@/lib/cx";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import type { ShotFilter, ShotSide } from "@/models/ShotFilter";
import type { ShotPlayerOption } from "@/models/ShotPlayerOption";

type ShotChartFiltersProps = {
  options: ShotPlayerOption[];
  periods: number[];
  filter: ShotFilter;
  onChange: (filter: ShotFilter) => void;
};

const ALL = "";
const SELECT_CLASSES =
  "min-h-[46px] w-full appearance-none rounded-lg border-2 border-rpb-ink bg-rpb-cream py-2.5 pr-10 pl-3.5 text-[15px] font-semibold text-rpb-ink focus-ring";

export function ShotChartFilters({ options, periods, filter, onChange }: ShotChartFiltersProps) {
  const sideId = useId();
  const playerId = useId();
  const periodId = useId();

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
        <label htmlFor={sideId} className="text-[13px] font-semibold">
          Équipe
        </label>
        <div className="relative">
          <select
            id={sideId}
            value={filter.side}
            onChange={(event) => onChange({ ...filter, side: event.target.value as ShotSide, playerLicence: null })}
            className={SELECT_CLASSES}
          >
            <option value="team">Mon équipe</option>
            <option value="opponent">Équipe adverse</option>
          </select>
          <ChevronDownIcon size={18} strokeWidth={2.5} className="pointer-events-none absolute top-3.5 right-3.5 text-rpb-ink" />
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
        <label htmlFor={playerId} className="text-[13px] font-semibold">
          Joueur
        </label>
        <div className="relative">
          <select
            id={playerId}
            value={filter.playerLicence ?? ALL}
            disabled={filter.side === "opponent"}
            onChange={(event) => onChange({ ...filter, playerLicence: event.target.value || null })}
            className={cx(SELECT_CLASSES, "disabled:opacity-50")}
          >
            <option value={ALL}>Tous les joueurs</option>
            {options.map((option) => (
              <option key={option.licence} value={option.licence}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon size={18} strokeWidth={2.5} className="pointer-events-none absolute top-3.5 right-3.5 text-rpb-ink" />
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
        <label htmlFor={periodId} className="text-[13px] font-semibold">
          Quart-temps
        </label>
        <div className="relative">
          <select
            id={periodId}
            value={filter.period === null ? ALL : String(filter.period)}
            onChange={(event) => onChange({ ...filter, period: event.target.value ? Number(event.target.value) : null })}
            className={SELECT_CLASSES}
          >
            <option value={ALL}>Tous les quart-temps</option>
            {periods.map((period) => (
              <option key={period} value={period}>
                {formatPeriodLabel(period)}
              </option>
            ))}
          </select>
          <ChevronDownIcon size={18} strokeWidth={2.5} className="pointer-events-none absolute top-3.5 right-3.5 text-rpb-ink" />
        </div>
      </div>
    </div>
  );
}
