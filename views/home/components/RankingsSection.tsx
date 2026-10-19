import { EmptyState } from "@/components/ui/EmptyState";
import { PodiumIcon } from "@/components/ui/icons/PodiumIcon";
import { listSeasonRankings } from "@/repositories/RankingRepository";
import { RankingCard } from "@/views/home/components/RankingCard";

type RankingsSectionProps = { seasonId: number };

export async function RankingsSection({ seasonId }: RankingsSectionProps) {
  const rankings = await listSeasonRankings(seasonId);
  const allEmpty = rankings.every((ranking) => ranking.entries.length === 0);

  return (
    <section id="classements" aria-labelledby="classements-title" className="flex scroll-mt-5 flex-col gap-5">
      <div className="on-scroll flex flex-wrap items-baseline justify-between gap-2 border-b-[3px] border-rpb-bordeaux pb-2">
        <h2 id="classements-title" className="font-display text-[26px] font-black">
          Classements de la saison
        </h2>
        <p className="text-[13px] text-rpb-ink/72">Moyenne par match · cumul de la saison en dessous</p>
      </div>
      {allEmpty ? (
        <div className="rounded-lg border-2 border-rpb-ink/14 p-5 shadow-card">
          <EmptyState
            icon={<PodiumIcon size={40} />}
            title="Aucune statistique saisie"
            text="Les classements apparaîtront après la première saisie."
          />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
          {rankings.map((ranking) => (
            <RankingCard key={ranking.category.key} ranking={ranking} />
          ))}
        </div>
      )}
    </section>
  );
}
