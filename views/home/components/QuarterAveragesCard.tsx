import { Card } from "@/components/ui/Card";
import { CardSubtitle } from "@/components/ui/CardSubtitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/ui/icons/ChartIcon";
import { getQuarterAverages } from "@/repositories/TeamStatsRepository";
import { QuarterAveragesTable } from "@/views/home/components/QuarterAveragesTable";
import { QuarterPointsChart } from "@/views/home/components/QuarterPointsChart";

type QuarterAveragesCardProps = {
  seasonId: number;
  className?: string;
};

export async function QuarterAveragesCard({ seasonId, className }: QuarterAveragesCardProps) {
  const averages = await getQuarterAverages(seasonId);

  return (
    <Card
      title="Moyennes de l'équipe par quart-temps"
      subtitle={averages && <CardSubtitle>Par match, sur les matchs avec statistiques saisies</CardSubtitle>}
      animation="on-scroll"
      className={className}
    >
      {averages === null ? (
        <EmptyState icon={<ChartIcon size={40} />} title="Aucune statistique saisie pour cette saison" />
      ) : (
        <div className="flex flex-wrap items-stretch gap-6">
          <QuarterPointsChart points={averages.points} />
          <QuarterAveragesTable averages={averages} />
        </div>
      )}
    </Card>
  );
}
