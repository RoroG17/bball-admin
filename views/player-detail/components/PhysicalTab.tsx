import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/ui/icons/ChartIcon";
import { animationDelay } from "@/lib/animationDelay";
import { pluralize } from "@/lib/format";
import { MEASUREMENT_TYPES } from "@/models/MeasurementType";
import { getPhysicalRecord } from "@/repositories/PhysicalRepository";
import { AddMeasurementDialog } from "@/views/player-detail/components/AddMeasurementDialog";
import { PhysicalMeasurementCard } from "@/views/player-detail/components/PhysicalMeasurementCard";
import { UnknownMeasurementsNotice } from "@/views/player-detail/components/UnknownMeasurementsNotice";

type PhysicalTabProps = { licence: string; isAdmin: boolean; today: string };

export async function PhysicalTab({ licence, isAdmin, today }: PhysicalTabProps) {
  const { measurements, unknownEntries } = await getPhysicalRecord(licence);

  return (
    <section aria-labelledby="player-tab-physical" className="flex flex-col gap-5">
      <h2 id="player-tab-physical" className="sr-only">
        Physique
      </h2>
      <div className="reveal flex flex-wrap items-center justify-between gap-4" style={animationDelay(380)}>
        <p className="text-[15px]/[22px] font-semibold tabular-nums">{pluralize(measurements.length, "mesure", "mesures")}</p>
        {isAdmin && <AddMeasurementDialog licence={licence} today={today} />}
      </div>
      {isAdmin && unknownEntries.length > 0 && (
        <div className="reveal" style={animationDelay(420)}>
          <UnknownMeasurementsNotice entries={unknownEntries} />
        </div>
      )}
      {measurements.length === 0 ? (
        <Card title="Physique" animation="reveal" delayMs={460}>
          <EmptyState
            icon={<ChartIcon size={40} strokeWidth={1.6} />}
            title="Aucune donnée physique enregistrée pour ce joueur."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
          {MEASUREMENT_TYPES.map((type, index) => (
            <PhysicalMeasurementCard
              key={type}
              type={type}
              measurements={measurements.filter((measurement) => measurement.type === type)}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
