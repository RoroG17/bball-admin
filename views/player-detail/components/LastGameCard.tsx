import { useId } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameStatusBadge } from "@/components/ui/GameStatusBadge";
import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { VenueBadge } from "@/components/ui/VenueBadge";
import { animationDelay } from "@/lib/animationDelay";
import { capitalizeFirst, formatGameDate } from "@/lib/format";
import { describeCalendarGame } from "@/models/describeCalendarGame";
import type { GameLogEntry } from "@/models/GameLogEntry";
import { LastGameScoreboardRow } from "@/views/player-detail/components/LastGameScoreboardRow";

type LastGameCardProps = {
  entry: GameLogEntry | null;
  seasonLabel: string | null;
};

/** Dernier match AVEC stats du joueur : tableau de score bordeaux, comme l'accueil. Aucune rotation (P15). */
export function LastGameCard({ entry, seasonLabel }: LastGameCardProps) {
  const headingId = useId();

  if (entry === null) {
    return (
      <Card title="Dernier match" animation="reveal" delayMs={120} className="flex-[1_1_300px]">
        <EmptyState
          icon={<BallIcon size={40} strokeWidth={1.6} />}
          title="Aucun match joué"
          text="Ses statistiques apparaîtront après son premier match."
        />
      </Card>
    );
  }

  const { overview } = entry;

  return (
    <section
      aria-labelledby={headingId}
      className="reveal flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-bordeaux p-5 text-rpb-cream shadow-score"
      style={animationDelay(120)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-xs font-semibold tracking-[.08em] text-rpb-gold-light uppercase">
          Dernier match
        </h2>
        {overview && <GameStatusBadge entry={overview} popDelayMs={1000} />}
      </div>
      {overview ? (
        <>
          <p className="sr-only">{describeCalendarGame(overview)}</p>
          <div aria-hidden="true" className="flex flex-col gap-2.5">
            <LastGameScoreboardRow team={overview.game.home} side="home" overview={overview} />
            <div className="h-px bg-rpb-cream/22" />
            <LastGameScoreboardRow team={overview.game.away} side="away" overview={overview} />
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]/[18px] text-rpb-gold-light">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-rpb-cream">{capitalizeFirst(formatGameDate(overview.game.date))}</span>
              <span className="tabular-nums">Journée {overview.game.number}</span>
              <VenueBadge side={overview.rpbSide} variant="dark" />
            </p>
            {seasonLabel && <p>Saison {seasonLabel}</p>}
          </div>
        </>
      ) : (
        <p className="text-base/[22px] font-semibold">{entry.gameLabel}</p>
      )}
      <div className="mt-auto">
        <PrimaryButton variant="gold" href={`/game/${entry.gameId}`}>
          Voir le match
          <ArrowRightIcon size={18} strokeWidth={2.5} className="btn-arrow shrink-0" />
        </PrimaryButton>
      </div>
    </section>
  );
}
