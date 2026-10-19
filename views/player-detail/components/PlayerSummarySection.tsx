import { averagePlayingTime } from "@/models/averagePlayingTime";
import { buildPlayerCounters } from "@/models/buildPlayerCounters";
import { computeGameLogAverages } from "@/models/computeGameLogAverages";
import { filterGameLog } from "@/models/filterGameLog";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { getLastGameEntry } from "@/models/getLastGameEntry";
import type { PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";
import type { Season } from "@/models/Season";
import { countPlayerExams } from "@/repositories/ExamRepository";
import { getPlayerGameLog } from "@/repositories/PlayerStatsRepository";
import { LastGameCard } from "@/views/player-detail/components/LastGameCard";
import { LastGameStatsCard } from "@/views/player-detail/components/LastGameStatsCard";
import { PlayerCounters } from "@/views/player-detail/components/PlayerCounters";

type PlayerSummarySectionProps = {
  licence: string;
  seasons: Season[];
  selection: PlayerSeasonSelection;
  showExamCount: boolean;
  today: string;
};

/**
 * Trois cartes de la zone de synthèse. Racine `contents` : les cartes deviennent des éléments du wrapper `flex-wrap`
 * de la vue (DS39). « Dernier match » = dernier match AVEC stats, comparé à la moyenne de SA saison.
 */
export async function PlayerSummarySection({ licence, seasons, selection, showExamCount, today }: PlayerSummarySectionProps) {
  const [log, examCount] = await Promise.all([
    getPlayerGameLog(licence, seasons, today),
    showExamCount ? countPlayerExams(licence) : Promise.resolve(null),
  ]);
  const last = getLastGameEntry(log);
  const lastSeason = last ? (seasons.find((season) => season.id === last.seasonId) ?? null) : null;
  const seasonLog = lastSeason ? filterGameLog(log, { kind: "season", season: lastSeason }) : [];
  const seasonLabel = lastSeason ? formatSeasonLabel(lastSeason) : null;

  return (
    <div className="contents">
      <LastGameCard entry={last} seasonLabel={seasonLabel} />
      {last && (
        <LastGameStatsCard
          entry={last}
          seasonAverages={computeGameLogAverages(seasonLog, "all")}
          seasonAverageMinutes={averagePlayingTime(seasonLog)}
          seasonLabel={seasonLabel}
        />
      )}
      <PlayerCounters counters={buildPlayerCounters({ log, selection, examCount, seasonCount: seasons.length })} selection={selection} />
    </div>
  );
}
