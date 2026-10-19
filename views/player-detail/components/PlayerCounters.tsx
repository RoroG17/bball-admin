import { Card } from "@/components/ui/Card";
import type { PlayerCounters as PlayerCountersData } from "@/models/buildPlayerCounters";
import { describePlayerSeasonSelection } from "@/models/describePlayerSeasonSelection";
import type { PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";

type PlayerCountersProps = {
  counters: PlayerCountersData;
  selection: PlayerSeasonSelection;
};

const word = (count: number, singular: string, plural: string) => (Math.abs(count) > 1 ? plural : singular);

/** Les compteurs sont liés à la sélection : « 10 matchs avec stats · 2025-2026 … · 18 au total ». */
export function PlayerCounters({ counters, selection }: PlayerCountersProps) {
  const selectionDetail =
    selection.kind === "career"
      ? describePlayerSeasonSelection(selection)
      : `${describePlayerSeasonSelection(selection)} · ${counters.totalGames} au total`;

  const items = [
    {
      key: "games",
      value: counters.selectionGames,
      label: word(counters.selectionGames, "match avec stats", "matchs avec stats"),
      detail: selectionDetail,
    },
    ...(counters.exams === null
      ? []
      : [{ key: "exams", value: counters.exams, label: word(counters.exams, "examen", "examens"), detail: null }]),
    { key: "seasons", value: counters.seasons, label: word(counters.seasons, "saison", "saisons"), detail: null },
  ];

  return (
    <Card
      title="En chiffres"
      titleStyle="eyebrow"
      animation="reveal"
      delayMs={240}
      className="@container flex-[1_1_300px]"
    >
      <dl className="grid gap-3.5 @xl:auto-cols-fr @xl:grid-flow-col">
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5">
            <dt className="col-start-2 row-start-1 text-[15px]/5 font-semibold">{item.label}</dt>
            <dd className="col-start-1 row-span-2 row-start-1 min-w-[2ch] text-right font-display text-[30px] leading-none font-black text-rpb-bordeaux tabular-nums">
              {item.value}
            </dd>
            {item.detail && (
              <dd className="col-start-2 row-start-2 text-[13px]/[18px] text-rpb-ink/72">{item.detail}</dd>
            )}
          </div>
        ))}
      </dl>
    </Card>
  );
}
