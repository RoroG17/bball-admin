import { cx } from "@/lib/cx";
import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import type { PeriodSelection } from "@/models/PeriodSelection";

type PeriodFilterProps = {
  periods: number[];
  selection: PeriodSelection;
  onChange: (selection: PeriodSelection) => void;
};

/** Contrôle segmenté : état actif porté par `aria-pressed` et par un fond plein (P13). Cibles de 48 px. */
export function PeriodFilter({ periods, selection, onChange }: PeriodFilterProps) {
  const options: PeriodSelection[] = ["all", ...periods];

  return (
    <div
      role="group"
      aria-label="Période affichée"
      className="inline-flex flex-wrap gap-1 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-1"
    >
      {options.map((option) => {
        const pressed = option === selection;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option)}
            className={cx(
              "min-h-12 min-w-12 rounded-md px-3.5 text-[15px] font-bold tabular-nums transition-colors focus-ring",
              pressed ? "bg-rpb-bordeaux text-rpb-cream" : "text-rpb-ink hover:bg-rpb-gold-light",
            )}
          >
            {option === "all" ? (
              "Tout"
            ) : (
              <>
                <span aria-hidden="true">{formatPeriodLabel(option)}</span>
                <span className="sr-only">{formatPeriodLabel(option, "long")}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
