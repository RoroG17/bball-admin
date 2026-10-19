import { Card } from "@/components/ui/Card";
import { CardSubtitle } from "@/components/ui/CardSubtitle";
import { computeGameLogAverages } from "@/models/computeGameLogAverages";
import { computeGameLogPeriodAverages } from "@/models/computeGameLogPeriodAverages";
import type { GameLogEntry } from "@/models/GameLogEntry";
import { PlayerQuarterAveragesTable } from "@/views/player-detail/components/PlayerQuarterAveragesTable";
import { PlayerQuarterPointsChart } from "@/views/player-detail/components/PlayerQuarterPointsChart";

type PlayerQuarterAveragesSectionProps = {
  /** Journal non vide (l'onglet affiche un état vide sinon). */
  log: GameLogEntry[];
  periods: number[];
  selectionLabel: string;
};

export function PlayerQuarterAveragesSection({ log, periods, selectionLabel }: PlayerQuarterAveragesSectionProps) {
  const rows = computeGameLogPeriodAverages(log, periods);
  const overall = computeGameLogAverages(log, "all");
  if (!overall) return null;

  return (
    <Card
      title="Moyennes par quart-temps"
      subtitle={<CardSubtitle>Par match · {selectionLabel}</CardSubtitle>}
      animation="on-scroll"
      className="flex-[999_1_560px]"
    >
      <div className="flex flex-wrap items-start gap-6">
        <PlayerQuarterPointsChart rows={rows} overall={overall} />
        <PlayerQuarterAveragesTable rows={rows} overall={overall} />
      </div>
    </Card>
  );
}
