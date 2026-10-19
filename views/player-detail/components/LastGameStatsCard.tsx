import { Card } from "@/components/ui/Card";
import { formatPlayingTime } from "@/lib/format";
import type { GameLogEntry } from "@/models/GameLogEntry";
import { getTeamStatValue } from "@/models/getTeamStatValue";
import { LAST_GAME_SUMMARY_LABELS, LAST_GAME_SUMMARY_STATS } from "@/models/lastGameSummaryStats";
import type { StatTotals } from "@/models/StatTotals";
import { sumPeriodStats } from "@/models/sumPeriodStats";
import { StatComparisonValue } from "@/views/player-detail/components/StatComparisonValue";

type LastGameStatsCardProps = {
  entry: GameLogEntry;
  /** Moyenne par match sur la saison du dernier match, `null` sans match. */
  seasonAverages: StatTotals | null;
  seasonAverageMinutes: number | null;
  seasonLabel: string | null;
};

const LEGEND = [
  { label: "au-dessus de sa moyenne", marker: "bg-rpb-gold" },
  { label: "en dessous", marker: "bg-rpb-ink" },
  { label: "égal", marker: "border-[1.5px] border-rpb-ink/30" },
];

export function LastGameStatsCard({ entry, seasonAverages, seasonAverageMinutes, seasonLabel }: LastGameStatsCardProps) {
  const totals = sumPeriodStats(entry.periods);

  return (
    <Card title="Son dernier match" animation="reveal" delayMs={180} className="flex-[1_1_300px]">
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,100px),1fr))] gap-2.5">
        {LAST_GAME_SUMMARY_STATS.map((stat, index) => (
          <StatComparisonValue
            key={stat}
            label={LAST_GAME_SUMMARY_LABELS[stat]}
            value={getTeamStatValue(totals, stat)}
            average={seasonAverages === null ? null : getTeamStatValue(seasonAverages, stat)}
            index={index}
          />
        ))}
        <StatComparisonValue
          label="Minutes"
          value={entry.playingTimeSeconds}
          average={seasonAverageMinutes}
          index={LAST_GAME_SUMMARY_STATS.length}
          format={formatPlayingTime}
          compare={false}
        />
      </dl>
      <div className="flex flex-col gap-1.5 text-[13px]/[18px] text-rpb-ink/72">
        <ul aria-hidden="true" className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1.5 p-0">
          {LEGEND.map(({ label, marker }) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <span className={`size-3 rounded-full ${marker}`} />
              {label}
            </li>
          ))}
        </ul>
        {seasonLabel && <p>Comparé à sa moyenne sur la saison {seasonLabel}.</p>}
      </div>
    </Card>
  );
}
