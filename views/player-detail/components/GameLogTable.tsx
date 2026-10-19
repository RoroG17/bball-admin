"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { averagePlayingTime } from "@/models/averagePlayingTime";
import { computeGameLogAverages } from "@/models/computeGameLogAverages";
import { computeGameLogTotals } from "@/models/computeGameLogTotals";
import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import { formatPeriodParam } from "@/models/formatPeriodParam";
import type { GameLogEntry } from "@/models/GameLogEntry";
import { parsePeriodSelection } from "@/models/parsePeriodSelection";
import type { PeriodSelection } from "@/models/PeriodSelection";
import { PLAYER_STAT_COLUMNS } from "@/models/playerStatColumns";
import { cx } from "@/lib/cx";
import { GameLogRow } from "@/views/player-detail/components/GameLogRow";
import { GameLogSummaryRow } from "@/views/player-detail/components/GameLogSummaryRow";

type GameLogTableProps = {
  log: GameLogEntry[];
  periods: number[];
  selectionLabel: string;
};

const PERIOD_PARAM = "periode";
const HEAD =
  "border-b-2 border-rpb-ink bg-rpb-cream px-2 py-2.5 text-right text-xs font-semibold tracking-[.06em] whitespace-nowrap text-rpb-ink/72 uppercase";
const COLUMNS = PLAYER_STAT_COLUMNS.filter((column) => column.key !== "name");

/** Journal match par match : période dans l'URL (`?periode=q3`, sans entrée d'historique), en-têtes non triables (D16). */
export function GameLogTable({ log, periods, selectionLabel }: GameLogTableProps) {
  const searchParams = useSearchParams();
  const captionId = useId();
  const selection = parsePeriodSelection(searchParams.get(PERIOD_PARAM), periods);
  // Les lignes n'entrent en cascade qu'au premier affichage (DS37).
  const [hasInteracted, setHasInteracted] = useState(false);

  const showMinutes = selection === "all";
  const columns = COLUMNS.filter((column) => showMinutes || !column.allPeriodsOnly);
  const totals = computeGameLogTotals(log, selection);
  const averages = computeGameLogAverages(log, selection) ?? totals;
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
      <p className="flex items-center gap-1.5 text-[13px]/[18px] text-rpb-ink/72 @5xl:hidden">
        <ArrowRightIcon size={16} strokeWidth={2.2} className="shrink-0" />
        Fais défiler le tableau vers la droite pour voir toutes les colonnes.
      </p>
      <div role="region" tabIndex={0} aria-labelledby={captionId} className="relative min-w-0 overflow-x-auto rounded-md focus-ring">
        <table className="w-full border-separate border-spacing-0 tabular-nums">
          <caption id={captionId} className="caption-top pb-2.5 text-left text-[15px]/[22px] font-bold">
            Statistiques match par match, {selectionLabel}, {scope}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={cx(HEAD, "sticky left-0 z-[2] min-w-[120px] border-r border-r-rpb-ink/12 pl-3 text-left")}>
                Match
              </th>
              <th scope="col" className={cx(HEAD, "text-left")}>
                Adversaire
              </th>
              <th scope="col" className={cx(HEAD, "text-left")}>
                Résultat
              </th>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cx(HEAD, column.key === "twoPoints" && "border-l-2 border-l-rpb-ink/12")}>
                  <span aria-hidden="true">{column.abbr}</span>
                  <span className="sr-only">{column.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.map((entry, index) => (
              <GameLogRow
                key={entry.gameId}
                entry={entry}
                selection={selection}
                showMinutes={showMinutes}
                animationIndex={hasInteracted ? null : index}
              />
            ))}
          </tbody>
          <tfoot>
            <GameLogSummaryRow
              label="Moyenne par match"
              totals={averages}
              kind="average"
              minutes={averagePlayingTime(log)}
              showMinutes={showMinutes}
            />
            <GameLogSummaryRow label="Total" totals={totals} kind="total" minutes={null} showMinutes={showMinutes} />
          </tfoot>
        </table>
      </div>
    </div>
  );
}
