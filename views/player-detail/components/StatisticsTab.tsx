import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/ui/icons/ChartIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SeasonSelector } from "@/components/ui/SeasonSelector";
import { animationDelay } from "@/lib/animationDelay";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { computeGameLogTotals } from "@/models/computeGameLogTotals";
import { describePlayerSeasonSelection } from "@/models/describePlayerSeasonSelection";
import { filterGameLog } from "@/models/filterGameLog";
import { formatPlayerSeasonParam } from "@/models/formatPlayerSeasonParam";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { listGamePeriods } from "@/models/listGamePeriods";
import { CAREER_PARAM, type PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";
import type { Season } from "@/models/Season";
import { getPlayerGameLog } from "@/repositories/PlayerStatsRepository";
import { GameLogSection } from "@/views/player-detail/components/GameLogSection";
import { PlayerQuarterAveragesSection } from "@/views/player-detail/components/PlayerQuarterAveragesSection";
import { PlayerShootingSection } from "@/views/player-detail/components/PlayerShootingSection";

type StatisticsTabProps = {
  licence: string;
  seasons: Season[];
  selection: PlayerSeasonSelection;
  today: string;
};

export async function StatisticsTab({ licence, seasons, selection, today }: StatisticsTabProps) {
  const fullLog = await getPlayerGameLog(licence, seasons, today);
  const log = filterGameLog(fullLog, selection);
  const periods = listGamePeriods(log);
  const selectionLabel = describePlayerSeasonSelection(selection);
  const seasonParam = formatPlayerSeasonParam(selection);
  const options = [
    ...seasons.map((season) => ({ id: season.id, label: formatSeasonLabel(season) })),
    { id: CAREER_PARAM, label: "Carrière" },
  ];

  return (
    <section aria-labelledby="player-tab-statistics" className="flex flex-col gap-5">
      <h2 id="player-tab-statistics" className="sr-only">
        Statistiques
      </h2>
      <div className="reveal flex flex-wrap items-end justify-between gap-4" style={animationDelay(380)}>
        <SeasonSelector
          key={seasonParam}
          options={options}
          selectedId={selection.kind === "career" ? CAREER_PARAM : selection.season.id}
          basePath={`/player/${encodeURIComponent(licence)}`}
          label="Saison"
          className="flex-[0_1_420px]"
        />
      </div>
      {fullLog.length === 0 ? (
        <Card title="Statistiques" animation="reveal" delayMs={420}>
          <EmptyState
            icon={<ChartIcon size={40} strokeWidth={1.6} />}
            title="Aucune statistique enregistrée pour ce joueur."
          />
        </Card>
      ) : log.length === 0 ? (
        <Card title="Statistiques" animation="reveal" delayMs={420}>
          <EmptyState
            icon={<ChartIcon size={40} strokeWidth={1.6} />}
            title={`Aucune statistique sur la saison ${selectionLabel}.`}
          />
          <div className="flex justify-center">
            <PrimaryButton variant="outline" href={buildPlayerHref(licence, { saison: CAREER_PARAM })}>
              Voir sa carrière
            </PrimaryButton>
          </div>
        </Card>
      ) : (
        <>
          <GameLogSection log={log} periods={periods} selectionLabel={selectionLabel} />
          <div className="flex flex-wrap items-start gap-5">
            <PlayerQuarterAveragesSection log={log} periods={periods} selectionLabel={selectionLabel} />
            <PlayerShootingSection totals={computeGameLogTotals(log, "all")} selectionLabel={selectionLabel} />
          </div>
        </>
      )}
    </section>
  );
}
