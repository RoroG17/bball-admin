"use client";

import { useId, useState, type ReactNode } from "react";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { formatShootingRatio, pluralize } from "@/lib/format";
import { countFieldGoalAttempts } from "@/models/countFieldGoalAttempts";
import { describeShotChart } from "@/models/describeShotChart";
import { describeShotScope } from "@/models/describeShotScope";
import type { FieldGoalAttempt } from "@/models/FieldGoalAttempt";
import { filterShots } from "@/models/filterShots";
import type { Shot } from "@/models/Shot";
import type { ShotFilter } from "@/models/ShotFilter";
import type { ShotPlayerOption } from "@/models/ShotPlayerOption";
import { summarizeShots } from "@/models/summarizeShots";
import { ShotChartFilters } from "@/views/game-detail/components/ShotChartFilters";
import { ShotLegend } from "@/components/ui/ShotLegend";
import { ShotMarker } from "@/components/ui/ShotMarker";

type ShotChartProps = {
  shots: Shot[];
  options: ShotPlayerOption[];
  periods: number[];
  attempts: FieldGoalAttempt[];
  initialFilter: ShotFilter;
  /** Lignes du terrain, rendues côté serveur (`HalfCourt`). */
  court: ReactNode;
};

/** Carte des tirs filtrable ; réussi / manqué portés par la forme (cercle / croix), P11, P13. */
export function ShotChart({ shots, options, periods, attempts, initialFilter, court }: ShotChartProps) {
  const titleId = useId();
  const [filter, setFilter] = useState<ShotFilter>(initialFilter);

  const visible = filterShots(shots, filter);
  const summary = summarizeShots(visible);
  const attempted = countFieldGoalAttempts(attempts, filter);
  const description = describeShotChart(summary, attempted, describeShotScope(filter, options));

  return (
    <div className="@container min-w-0">
      <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_280px] @3xl:grid-rows-[auto_auto_auto_1fr] @3xl:gap-x-6">
        <div className="@3xl:col-start-2 @3xl:row-start-1">
          <ShotChartFilters options={options} periods={periods} filter={filter} onChange={setFilter} />
        </div>
        <p aria-live="polite" className="flex items-baseline gap-2 @3xl:col-start-2 @3xl:row-start-2">
          <span className="font-display text-[30px] leading-none font-black tabular-nums">
            {formatShootingRatio(summary.made, summary.total)}
          </span>
          <span className="text-[15px] font-semibold">réussis</span>
        </p>
        <div className="relative max-w-[680px] @3xl:col-start-1 @3xl:row-span-4 @3xl:row-start-1">
          <svg
            viewBox="0 0 750 530"
            role="img"
            aria-labelledby={titleId}
            className="block h-auto w-full rounded-md border-2 border-rpb-ink"
          >
            <title id={titleId}>{description}</title>
            {court}
            {visible.map((shot, index) => (
              <ShotMarker key={shot.id} shot={shot} index={index} />
            ))}
          </svg>
          {visible.length === 0 && (
            <p className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-rpb-ink bg-rpb-cream px-3 py-2 text-sm font-semibold whitespace-nowrap">
              Aucun tir pour cette sélection.
            </p>
          )}
        </div>
        <div className="@3xl:col-start-2 @3xl:row-start-3">
          <ShotLegend />
        </div>
        {attempted > summary.total && (
          <div className="@3xl:col-start-2 @3xl:row-start-4 @3xl:self-start">
            <SummaryNotice
              tone="light"
              message={`${pluralize(summary.total, "tir placé", "tirs placés")} sur ${attempted} ${attempted > 1 ? "tentés" : "tenté"}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
