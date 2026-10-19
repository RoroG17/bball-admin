import { Card } from "@/components/ui/Card";
import { computeTeamPeriodTotals } from "@/models/computeTeamPeriodTotals";
import { computeTeamTotals } from "@/models/computeTeamTotals";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import { TeamPeriodPointsChart } from "@/views/game-detail/components/TeamPeriodPointsChart";
import { TeamQuarterStatsTable } from "@/views/game-detail/components/TeamQuarterStatsTable";

type TeamQuarterStatsSectionProps = { lines: PlayerGameStats[]; periods: number[] };

export function TeamQuarterStatsSection({ lines, periods }: TeamQuarterStatsSectionProps) {
  const perPeriod = computeTeamPeriodTotals(lines, periods);
  const total = computeTeamTotals(lines, "all");

  return (
    <Card title="Statistiques d'équipe par quart-temps" animation="on-scroll">
      <div className="flex flex-wrap items-start gap-6">
        <TeamPeriodPointsChart perPeriod={perPeriod} total={total} />
        <TeamQuarterStatsTable perPeriod={perPeriod} total={total} />
      </div>
    </Card>
  );
}
