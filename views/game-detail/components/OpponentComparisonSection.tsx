import { Card } from "@/components/ui/Card";
import { animationDelay } from "@/lib/animationDelay";
import { computeBarHeight } from "@/models/computeBarHeight";
import { computeChartScale } from "@/models/computeChartScale";
import { computeTeamTotals } from "@/models/computeTeamTotals";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import type { StatTotals } from "@/models/StatTotals";

type OpponentComparisonSectionProps = {
  playerLines: PlayerGameStats[];
  opponentLines: PlayerGameStats[];
  opponentName: string;
};

type ComparedStat = { key: keyof Pick<StatTotals, "points" | "rebounds" | "assists" | "steals" | "blocks" | "turnovers" | "fouls">; label: string };

const COMPARED_STATS: readonly ComparedStat[] = [
  { key: "points", label: "Points" },
  { key: "rebounds", label: "Rebonds" },
  { key: "assists", label: "Passes déc." },
  { key: "steals", label: "Interceptions" },
  { key: "blocks", label: "Contres" },
  { key: "turnovers", label: "Ballons perdus" },
  { key: "fouls", label: "Fautes" },
];

/** Histogramme groupé : total des joueurs du RPB face à la ligne de l'adversaire, stat par stat. */
export function OpponentComparisonSection({ playerLines, opponentLines, opponentName }: OpponentComparisonSectionProps) {
  if (opponentLines.length === 0) return null;
  const team = computeTeamTotals(playerLines, "all");
  const opponent = computeTeamTotals(opponentLines, "all");
  const scale = computeChartScale(COMPARED_STATS.flatMap(({ key }) => [team[key], opponent[key]]));
  const summary = COMPARED_STATS.map(({ key, label }) => `${label} : ${team[key]} contre ${opponent[key]}`).join(", ");

  return (
    <Card title={`Joueurs vs ${opponentName}`} animation="on-scroll">
      <figure className="m-0 flex min-w-0 flex-col gap-3">
        <figcaption className="sr-only">Comparaison des statistiques des joueurs et de l&apos;adversaire. {summary}</figcaption>
        <div className="flex flex-wrap gap-4 text-[13px] font-semibold">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-[3px] bg-rpb-bordeaux" />
            Joueurs
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-[3px] bg-rpb-gold" />
            {opponentName}
          </span>
        </div>
        <div aria-hidden="true" className="overflow-x-auto">
          <div className="flex h-[190px] min-w-[460px] items-end gap-4 border-b-2 border-rpb-ink px-1">
            {COMPARED_STATS.map(({ key, label }, index) => (
              <div key={key} className="flex h-full flex-1 items-end justify-center gap-1" title={label}>
                {[
                  { value: team[key], color: "bg-rpb-bordeaux" },
                  { value: opponent[key], color: "bg-rpb-gold" },
                ].map(({ value, color }) => (
                  <div key={color} className="flex h-full w-full max-w-9 flex-col items-center justify-end gap-1">
                    <span className="text-[13px] font-bold tabular-nums">{value}</span>
                    <div
                      className={`bar w-full rounded-t ${color}`}
                      style={{ height: `${computeBarHeight(value, scale)}px`, ...animationDelay(200 + index * 100) }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex min-w-[460px] gap-4 px-1 pt-1.5">
            {COMPARED_STATS.map(({ key, label }) => (
              <span key={key} className="flex-1 text-center text-[12px] font-semibold">
                {label}
              </span>
            ))}
          </div>
        </div>
      </figure>
    </Card>
  );
}
