import { formatPercentDecimal, formatShootingRatio, pluralize } from "@/lib/format";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import { SHOT_ZONE_LABELS, SHOT_ZONES } from "@/models/ShotZone";
import type { ExamSummary } from "@/models/summarizeExam";
import { ExamZoneMarker } from "@/views/player-detail/components/ExamZoneMarker";

type ExamZoneSummaryProps = { summary: ExamSummary };

export function ExamZoneSummary({ summary }: ExamZoneSummaryProps) {
  return (
    <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5">
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {SHOT_ZONES.map((zone) => {
          const totals = summary.zones[zone];
          return (
            <li key={zone} className="flex items-center gap-3 rounded-lg border-2 border-rpb-ink/14 px-3 py-2.5">
              <ExamZoneMarker zone={zone} size={16} className="shrink-0" />
              <span className="flex-1 text-sm font-semibold">{SHOT_ZONE_LABELS[zone]}</span>
              {totals.attempted === 0 ? (
                <span className="text-sm text-rpb-ink/72">Aucun tir</span>
              ) : (
                <>
                  <span className="text-[15px] font-bold tabular-nums">
                    {formatShootingRatio(totals.made, totals.attempted)}
                  </span>
                  <span className="w-12 text-right text-[13px] text-rpb-ink/72 tabular-nums">
                    {formatPercentDecimal(computeShootingPercentage(totals.made, totals.attempted), 0)}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {summary.unknownZoneCount > 0 && (
        <p className="text-[13px]/[18px] text-rpb-ink/72">
          {pluralize(summary.unknownZoneCount, "tir sans zone", "tirs sans zone")} (comptés dans le total)
        </p>
      )}
    </div>
  );
}
