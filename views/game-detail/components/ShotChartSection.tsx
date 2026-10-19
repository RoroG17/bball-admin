import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HalfCourt } from "@/components/ui/HalfCourt";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { buildFieldGoalAttempts } from "@/models/buildFieldGoalAttempts";
import { buildShotPlayerOptions } from "@/models/buildShotPlayerOptions";
import { getInitialShotFilter } from "@/models/getInitialShotFilter";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import { listGameShots } from "@/repositories/ShotRepository";
import { ShotChart } from "@/views/game-detail/components/ShotChart";

type ShotChartSectionProps = {
  gameId: number;
  lines: PlayerGameStats[];
  opponentLines: PlayerGameStats[];
  periods: number[];
  currentLicence: string | null;
};

export async function ShotChartSection({ gameId, lines, opponentLines, periods, currentLicence }: ShotChartSectionProps) {
  const shots = await listGameShots(gameId);

  if (shots.length === 0) {
    return (
      <Card title="Carte des tirs" animation="on-scroll">
        <EmptyState icon={<BallIcon size={40} strokeWidth={1.6} />} title="Aucun tir placé pour ce match." />
      </Card>
    );
  }

  const options = buildShotPlayerOptions(lines, shots);
  return (
    <Card title="Carte des tirs" animation="on-scroll">
      <ShotChart
        shots={shots}
        options={options}
        periods={periods}
        attempts={buildFieldGoalAttempts([...lines, ...opponentLines])}
        initialFilter={getInitialShotFilter(currentLicence, options)}
        court={<HalfCourt />}
      />
    </Card>
  );
}
