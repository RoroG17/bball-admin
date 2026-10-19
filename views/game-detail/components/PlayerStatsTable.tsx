"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { buildPlayerStatRows } from "@/models/buildPlayerStatRows";
import { computeTeamTotals } from "@/models/computeTeamTotals";
import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import { formatPeriodParam } from "@/models/formatPeriodParam";
import { parsePeriodSelection } from "@/models/parsePeriodSelection";
import type { PeriodSelection } from "@/models/PeriodSelection";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import {
  DEFAULT_PLAYER_SORT,
  PLAYER_STAT_COLUMNS,
  type PlayerStatSort,
  type PlayerStatSortKey,
} from "@/models/playerStatColumns";
import { sortPlayerStatRows } from "@/models/sortPlayerStatRows";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { PlayerStatRowView } from "@/views/game-detail/components/PlayerStatRowView";
import { SortableColumnHeader } from "@/views/game-detail/components/SortableColumnHeader";
import { TeamTotalRow } from "@/views/game-detail/components/TeamTotalRow";

type PlayerStatsTableProps = {
  lines: PlayerGameStats[];
  periods: number[];
  duplicateLicences: string[];
  currentLicence: string | null;
};

const PERIOD_PARAM = "periode";

/** Feuille de stats : période dans l'URL (`?periode=q3`, sans entrée d'historique, D8), tri en état local. */
export function PlayerStatsTable({ lines, periods, duplicateLicences, currentLicence }: PlayerStatsTableProps) {
  const searchParams = useSearchParams();
  const captionId = useId();
  const selection = parsePeriodSelection(searchParams.get(PERIOD_PARAM), periods);
  const [sort, setSort] = useState<PlayerStatSort>(DEFAULT_PLAYER_SORT);
  // Les lignes n'entrent en cascade qu'au premier affichage (DS37).
  const [hasInteracted, setHasInteracted] = useState(false);

  const showMinutes = selection === "all";
  const columns = PLAYER_STAT_COLUMNS.filter((column) => showMinutes || !column.allPeriodsOnly);
  const rows = sortPlayerStatRows(
    buildPlayerStatRows(lines, selection, { currentLicence, duplicateLicences }),
    sort.key,
    sort.direction,
  );
  const total = computeTeamTotals(lines, selection);
  const scope = selection === "all" ? "match complet" : formatPeriodLabel(selection, "long").toLowerCase();

  function handlePeriodChange(next: PeriodSelection) {
    setHasInteracted(true);
    const params = new URLSearchParams(window.location.search);
    const value = formatPeriodParam(next);
    if (value === null) params.delete(PERIOD_PARAM);
    else params.set(PERIOD_PARAM, value);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }

  function handleSort(key: PlayerStatSortKey) {
    setHasInteracted(true);
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "name" ? "asc" : "desc" },
    );
  }

  return (
    <div className="@container flex min-w-0 flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PeriodFilter periods={periods} selection={selection} onChange={handlePeriodChange} />
        {!showMinutes && (
          <p className="flex items-center gap-1.5 text-[13px]/[18px] text-rpb-ink/72">
            <InfoIcon size={16} className="shrink-0" />
            Minutes : total du match, visibles avec « Tout ».
          </p>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-[13px]/[18px] text-rpb-ink/72 @4xl:hidden">
        <ArrowRightIcon size={16} strokeWidth={2.2} className="shrink-0" />
        Fais défiler le tableau vers la droite pour voir toutes les colonnes.
      </p>
      <div role="region" tabIndex={0} aria-labelledby={captionId} className="relative min-w-0 overflow-x-auto rounded-md focus-ring">
        <table className="w-full border-separate border-spacing-0 tabular-nums">
          <caption id={captionId} className="caption-top pb-2.5 text-left text-[15px]/[22px] font-bold">
            Statistiques par joueur, {scope}
          </caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <SortableColumnHeader key={column.key} column={column} sort={sort} onSort={handleSort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <PlayerStatRowView
                key={row.lineId}
                row={row}
                showMinutes={showMinutes}
                animationIndex={hasInteracted ? null : index}
              />
            ))}
          </tbody>
          <tfoot>
            <TeamTotalRow totals={total} showMinutes={showMinutes} />
          </tfoot>
        </table>
      </div>
    </div>
  );
}
