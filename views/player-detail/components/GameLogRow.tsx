import Link from "next/link";
import { GameStatusBadge } from "@/components/ui/GameStatusBadge";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { ShootingCell } from "@/components/ui/ShootingCell";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { VenueBadge } from "@/components/ui/VenueBadge";
import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { formatDate, formatPlayingTime } from "@/lib/format";
import type { GameLogEntry } from "@/models/GameLogEntry";
import { getOpponentTeam } from "@/models/getOpponentTeam";
import type { PeriodSelection } from "@/models/PeriodSelection";
import { selectPeriods } from "@/models/selectPeriods";
import { sumPeriodStats } from "@/models/sumPeriodStats";

type GameLogRowProps = {
  entry: GameLogEntry;
  selection: PeriodSelection;
  showMinutes: boolean;
  /** Rang pour l'entrée en cascade ; `null` = pas d'animation (après un filtre). */
  animationIndex: number | null;
};

const CELL = "border-b border-rpb-ink/12 px-2 py-2.5 text-right text-[15px]/5 whitespace-nowrap";
const COUNTERS = ["rebounds", "assists", "steals", "blocks", "turnovers", "fouls"] as const;
const muted = (isZero: boolean) => (isZero ? "text-rpb-ink/72" : undefined);

/** Aucune action au clic sur la ligne (P13) : seul le lien de la date mène au match. */
export function GameLogRow({ entry, selection, showMinutes, animationIndex }: GameLogRowProps) {
  const { overview } = entry;
  const totals = sumPeriodStats(selectPeriods(entry.periods, selection));
  const opponent = overview ? getOpponentTeam(overview) : null;
  const shortDate = overview ? formatDate(overview.game.date, "short") : null;
  const scoreSides =
    overview?.status === "played"
      ? overview.rpbSide === "away"
        ? { first: overview.game.away.score, second: overview.game.home.score, emphasis: true }
        : { first: overview.game.home.score, second: overview.game.away.score, emphasis: overview.rpbSide === "home" }
      : null;

  return (
    <tr
      className={cx(animationIndex !== null && "row-in")}
      style={animationIndex !== null ? animationDelay(460 + Math.min(animationIndex, 10) * 35) : undefined}
    >
      <th
        scope="row"
        className={cx(CELL, "sticky left-0 z-[1] min-w-[120px] border-r border-r-rpb-ink/12 bg-rpb-cream px-3 py-1 text-left font-normal")}
      >
        <span className="flex flex-col items-start gap-0.5 pb-1">
          <Link
            href={`/game/${entry.gameId}`}
            aria-label={shortDate ? `Match du ${shortDate}${opponent ? ` contre ${opponent.name}` : ""}` : "Voir le match"}
            className="inline-flex min-h-11 items-center rounded-sm font-semibold text-rpb-ink underline decoration-rpb-ink/30 decoration-2 underline-offset-4 focus-ring hover:text-rpb-bordeaux hover:decoration-rpb-bordeaux"
          >
            {shortDate ?? "Voir le match"}
          </Link>
          {overview && <span className="-mt-2 text-xs text-rpb-ink/72 tabular-nums">Journée {overview.game.number}</span>}
          {entry.lineCount > 1 && (
            <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-rpb-ink bg-rpb-gold-light px-2 py-0.5 text-[11px]/[14px] font-bold tracking-[.06em] uppercase">
              <AlertTriangleIcon size={12} strokeWidth={2.5} />
              Doublon
            </span>
          )}
        </span>
      </th>
      <td className={cx(CELL, "max-w-[240px] min-w-[190px] text-left whitespace-normal")}>
        {opponent ? (
          <span className="flex items-center gap-2.5">
            <TeamLogo name={opponent.name} logoUrl={opponent.logoUrl} isRpb={false} context="inline" decorative />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="line-clamp-2 text-[15px]/5 font-medium wrap-anywhere">{opponent.name}</span>
              <VenueBadge side={overview?.rpbSide ?? null} variant="label" />
            </span>
          </span>
        ) : (
          <span className="text-[15px]/5 font-medium">{entry.gameLabel}</span>
        )}
      </td>
      <td className={cx(CELL, "text-left whitespace-normal")}>
        <span className="flex flex-col items-start gap-1">
          {overview && <GameStatusBadge entry={overview} />}
          <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
            {scoreSides && (
              <>
                <span className={scoreSides.emphasis ? "font-extrabold" : undefined}>{scoreSides.first}</span> –{" "}
                {scoreSides.second}
              </>
            )}
            {overview?.status === "scoreMissing" && "– –"}
          </span>
        </span>
      </td>
      {showMinutes && <td className={cx(CELL, muted(entry.playingTimeSeconds === null))}>{formatPlayingTime(entry.playingTimeSeconds)}</td>}
      <td className={cx(CELL, "font-bold", muted(totals.points === 0))}>{totals.points}</td>
      {COUNTERS.map((key) => (
        <td key={key} className={cx(CELL, muted(totals[key] === 0))}>
          {totals[key]}
        </td>
      ))}
      <ShootingCell totals={totals.twoPoints} className={cx(CELL, "border-l-2 border-l-rpb-ink/12")} />
      <ShootingCell totals={totals.threePoints} className={CELL} />
      <ShootingCell totals={totals.freeThrows} className={CELL} />
    </tr>
  );
}
