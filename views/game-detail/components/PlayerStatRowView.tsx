import Link from "next/link";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { formatPlayingTime } from "@/lib/format";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { PlayerStatRow } from "@/models/PlayerStatRow";
import { ShootingCell } from "@/components/ui/ShootingCell";

type PlayerStatRowViewProps = {
  row: PlayerStatRow;
  showMinutes: boolean;
  /** Rang pour l'entrée en cascade ; `null` = pas d'animation (après un filtre ou un tri). */
  animationIndex: number | null;
};

const CELL = "border-b border-rpb-ink/12 px-2 py-2.5 text-right text-[15px]/5 whitespace-nowrap";
const COUNTERS = ["rebounds", "assists", "steals", "blocks", "turnovers", "fouls"] as const;

/** Les zéros et « — » sont atténués pour faire ressortir les valeurs utiles (DS28). */
const muted = (isZero: boolean) => (isZero ? "text-rpb-ink/72" : undefined);

export function PlayerStatRowView({ row, showMinutes, animationIndex }: PlayerStatRowViewProps) {
  const { player, totals, isCurrentUser, isDuplicate } = row;
  const highlight = isCurrentUser && "bg-rpb-gold-light";

  return (
    <tr
      className={cx(animationIndex !== null && "row-in")}
      style={animationIndex !== null ? animationDelay(400 + Math.min(animationIndex, 10) * 35) : undefined}
    >
      <th
        scope="row"
        className={cx(
          CELL,
          "sticky left-0 z-[1] min-w-[168px] border-r border-r-rpb-ink/12 bg-rpb-cream px-3 py-1 text-left font-normal whitespace-normal",
          highlight,
          isCurrentUser && "shadow-[inset_4px_0_0_var(--color-rpb-bordeaux)]",
        )}
      >
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <Link
            href={`/player/${encodeURIComponent(player.licence)}`}
            className="inline-flex min-h-11 items-center rounded-sm font-semibold text-rpb-ink underline decoration-rpb-ink/30 decoration-2 underline-offset-4 focus-ring hover:text-rpb-bordeaux hover:decoration-rpb-bordeaux"
          >
            {formatPlayerName(player)}
          </Link>
          {isCurrentUser && <span className="text-[13px] font-semibold text-rpb-bordeaux">(toi)</span>}
          {isDuplicate && (
            <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-rpb-ink bg-rpb-gold-light px-2 py-0.5 text-[11px]/[14px] font-bold tracking-[.06em] uppercase">
              <AlertTriangleIcon size={12} strokeWidth={2.5} />
              Doublon
            </span>
          )}
        </span>
      </th>
      {showMinutes && (
        <td className={cx(CELL, highlight, muted(row.playingTimeSeconds === null))}>
          {formatPlayingTime(row.playingTimeSeconds)}
        </td>
      )}
      <td className={cx(CELL, highlight, "font-bold", muted(totals.points === 0))}>{totals.points}</td>
      {COUNTERS.map((key) => (
        <td key={key} className={cx(CELL, highlight, muted(totals[key] === 0))}>
          {totals[key]}
        </td>
      ))}
      <ShootingCell totals={totals.twoPoints} className={cx(CELL, highlight, "border-l-2 border-l-rpb-ink/12")} />
      <ShootingCell totals={totals.threePoints} className={cx(CELL, highlight)} />
      <ShootingCell totals={totals.freeThrows} className={cx(CELL, highlight)} />
    </tr>
  );
}
