import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DonutIcon } from "@/components/ui/icons/DonutIcon";
import { computeWinRate } from "@/models/computeWinRate";
import { getSeasonRecord } from "@/repositories/GameRepository";
import { RecordDonut } from "@/views/home/components/RecordDonut";
import { RecordSummary } from "@/views/home/components/RecordSummary";

type SeasonRecordCardProps = { seasonId: number };

export async function SeasonRecordCard({ seasonId }: SeasonRecordCardProps) {
  const record = await getSeasonRecord(seasonId);
  const winRate = computeWinRate(record);

  return (
    <Card title="Bilan de la saison" interactive animation="reveal" delayMs={320}>
      {winRate === null ? (
        <EmptyState
          icon={<DonutIcon size={40} />}
          title="Aucun match joué"
          text="Le bilan s'affichera après le premier match."
        />
      ) : (
        <div className="flex flex-wrap items-center gap-5">
          <RecordDonut record={record} winRate={winRate} />
          <RecordSummary record={record} winRate={winRate} />
        </div>
      )}
    </Card>
  );
}
