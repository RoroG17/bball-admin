import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/ui/icons/ChartIcon";
import { LockIcon } from "@/components/ui/icons/LockIcon";
import { MEASUREMENT_TYPES } from "@/models/MeasurementType";
import { summarizeMeasurements } from "@/models/summarizeMeasurements";
import { getPhysicalRecord } from "@/repositories/PhysicalRepository";
import { MeasurementSummaryTile } from "@/views/player-detail/components/MeasurementSummaryTile";

type PhysicalSummarySectionProps = { licence: string };

/** Synthèse physique : rendue seulement si le lecteur y a droit (le chargement n'a même pas lieu sinon, P1). */
export async function PhysicalSummarySection({ licence }: PhysicalSummarySectionProps) {
  const { measurements } = await getPhysicalRecord(licence);

  return (
    <Card
      title="Données physiques"
      animation="reveal"
      delayMs={300}
      className="flex-[2_1_620px]"
      aside={
        <span className="inline-flex items-center gap-1.5 text-right text-[13px]/[18px] text-rpb-ink/72">
          <LockIcon size={14} strokeWidth={2.2} className="shrink-0" />
          Visible par le joueur et les admins
        </span>
      }
    >
      {measurements.length === 0 ? (
        <EmptyState icon={<ChartIcon size={40} strokeWidth={1.6} />} title="Aucune donnée physique enregistrée." />
      ) : (
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-3">
          {MEASUREMENT_TYPES.map((type) => (
            <MeasurementSummaryTile key={type} type={type} summary={summarizeMeasurements(measurements, type)} />
          ))}
        </dl>
      )}
    </Card>
  );
}
