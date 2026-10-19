import { animationDelay } from "@/lib/animationDelay";
import { getLeaders } from "@/models/getLeaders";
import { listSeasonRankings } from "@/repositories/RankingRepository";
import { LeaderTile } from "@/views/home/components/LeaderTile";

type LeadersStripProps = { seasonId: number };

/** Les n°1 de chaque classement (hors ballons perdus). Rien n'est affiché s'il n'y a aucun leader. */
export async function LeadersStrip({ seasonId }: LeadersStripProps) {
  const leaders = getLeaders(await listSeasonRankings(seasonId));
  if (leaders.length === 0) return null;

  return (
    <section
      aria-labelledby="leaders-title"
      className="reveal flex flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-bordeaux-dark p-5 text-rpb-cream"
      style={animationDelay(400)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="leaders-title" className="font-display text-[22px] font-black">
          Les leaders de la saison
        </h2>
        <a href="#classements" className="rounded-md text-sm font-semibold text-rpb-gold focus-ring">
          Tous les classements ↓
        </a>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-3">
        {leaders.map((leader, index) => (
          <LeaderTile
            key={`${leader.ranking.category.key}-${leader.entry.player.licence}`}
            leader={leader}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
