import { formatDecimal } from "@/lib/format";
import { compareToAverage } from "@/models/compareToAverage";
import { describeStatComparison } from "@/models/describeStatComparison";
import { StatComparisonIcon } from "@/views/player-detail/components/StatComparisonIcon";

type StatComparisonValueProps = {
  label: string;
  value: number | null;
  average: number | null;
  /** Rang de la tuile, pour la cascade de la pastille. */
  index: number;
  /** Formatage de la valeur et de la moyenne (défaut : une décimale au plus). */
  format?: (value: number) => string;
  /** `false` (minutes) : pas de pastille, jouer plus n'est pas « mieux ». */
  compare?: boolean;
};

/** Valeur du dernier match et moyenne de saison ; le sens n'est jamais porté par la couleur seule (P16). */
export function StatComparisonValue({
  label,
  value,
  average,
  index,
  format = (n) => formatDecimal(n, 1),
  compare = true,
}: StatComparisonValueProps) {
  const valueText = value === null ? "—" : format(value);
  const averageText = average === null ? "—" : format(average);
  const comparison = compare && value !== null ? compareToAverage(value, average) : "noAverage";
  const readable =
    compare && value !== null
      ? describeStatComparison(label, valueText, comparison, averageText)
      : `${label} : ${valueText}${average === null ? "" : ` (moyenne ${averageText})`}`;

  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border-2 border-rpb-ink/14 px-3 py-2.5">
      <dt className="text-[11px]/4 font-semibold tracking-[.08em] text-rpb-ink/72 uppercase hyphens-auto">{label}</dt>
      <dd className="flex flex-col gap-1">
        <span aria-hidden="true" className="flex items-center gap-2">
          <span className="font-display text-[28px] leading-none font-black tabular-nums">{valueText}</span>
          <StatComparisonIcon comparison={comparison} index={index} />
        </span>
        <span aria-hidden="true" className="text-[13px]/[18px] text-rpb-ink/72 tabular-nums">
          moy. {averageText}
        </span>
        <span className="sr-only">{readable}</span>
      </dd>
    </div>
  );
}
