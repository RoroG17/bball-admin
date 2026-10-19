import Link from "next/link";
import { CountUp } from "@/components/ui/CountUp";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { animationDelay } from "@/lib/animationDelay";
import { formatPlayerName } from "@/models/formatPlayerName";
import { formatRankingValue } from "@/models/formatRankingValue";
import type { Leader } from "@/models/getLeaders";

type LeaderTileProps = {
  leader: Leader;
  index: number;
};

export function LeaderTile({ leader: { ranking, entry }, index }: LeaderTileProps) {
  const { category } = ranking;
  const name = formatPlayerName(entry.player);

  return (
    <Link
      href={`/player/${encodeURIComponent(entry.player.licence)}`}
      aria-label={`${category.label} : ${name}, ${formatRankingValue(entry.value, category.valueUnit)} ${category.leaderUnit}. Voir la fiche.`}
      className="reveal lift flex min-w-0 items-center gap-3 rounded-lg bg-rpb-bordeaux px-3.5 py-3 text-rpb-cream no-underline focus-ring"
      style={animationDelay(480 + index * 60)}
    >
      <PlayerAvatar player={entry.player} size="lg" tone="gold" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-semibold tracking-[.08em] text-rpb-gold-light uppercase">{category.label}</span>
        <span className="truncate text-sm font-semibold">{name}</span>
      </span>
      <span className="flex flex-col items-end">
        <span className="font-display text-2xl leading-none font-black text-rpb-gold tabular-nums">
          <CountUp value={entry.value} kind={category.valueUnit === "percent" ? "percent" : "decimal"} />
        </span>
        <span className="text-[11px] whitespace-nowrap text-rpb-gold-light">{category.leaderUnit}</span>
      </span>
    </Link>
  );
}
