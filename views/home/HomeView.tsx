import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";
import { listAccessibleSeasons } from "@/repositories/SeasonRepository";
import { requireSession } from "@/repositories/SessionRepository";
import { AdminShortcuts } from "@/views/home/components/AdminShortcuts";
import { GamesSection } from "@/views/home/components/GamesSection";
import { HomeHeader } from "@/views/home/components/HomeHeader";
import { LeadersStrip } from "@/views/home/components/LeadersStrip";
import { NoSeasonState } from "@/views/home/components/NoSeasonState";
import { QuarterAveragesCard } from "@/views/home/components/QuarterAveragesCard";
import { RankingsSection } from "@/views/home/components/RankingsSection";
import { RosterCard } from "@/views/home/components/RosterCard";
import { SeasonRecordCard } from "@/views/home/components/SeasonRecordCard";

type HomeViewProps = {
  /** Valeur brute du paramètre `?saison=`, non validée. */
  requestedSeasonId: string | undefined;
};

const MAIN_CLASSES = "anim mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16";
const GRID_CLASSES = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5";
const AVERAGES_WIDTH = "flex-[999_1_560px]";
const ROSTER_WIDTH = "flex-[1_1_300px]";

export async function HomeView({ requestedSeasonId }: HomeViewProps) {
  const session = await requireSession();

  const seasons = sortSeasonsByRecency(await listAccessibleSeasons(session));
  const selected = resolveSelectedSeason(seasons, requestedSeasonId);
  if (!selected) {
    return (
      <main className={MAIN_CLASSES}>
        <NoSeasonState />
      </main>
    );
  }

  // L'URL reflète toujours la saison affichée (paramètre absent, invalide ou hors périmètre).
  if (requestedSeasonId !== String(selected.id)) redirect(`/?saison=${selected.id}`);

  const id = selected.id;
  const options = seasons.map((season) => ({ id: season.id, label: formatSeasonLabel(season) }));

  return (
    <main className={MAIN_CLASSES}>
      <HomeHeader options={options} selectedSeasonId={id} selectedSeasonLabel={formatSeasonLabel(selected)} />

      {session.role === "admin" && (
        <BlockErrorBoundary title="Raccourcis">
          <Suspense key={id} fallback={null}>
            <AdminShortcuts seasonId={id} />
          </Suspense>
        </BlockErrorBoundary>
      )}

      <div className={GRID_CLASSES}>
        <BlockErrorBoundary title="Matchs">
          <Suspense
            key={id}
            fallback={
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            }
          >
            <GamesSection seasonId={id} teamId={selected.teamId} />
          </Suspense>
        </BlockErrorBoundary>
        <BlockErrorBoundary title="Bilan de la saison">
          <Suspense key={id} fallback={<SkeletonCard lines={3} />}>
            <SeasonRecordCard seasonId={id} />
          </Suspense>
        </BlockErrorBoundary>
      </div>

      <BlockErrorBoundary title="Les leaders de la saison">
        <Suspense key={id} fallback={<SkeletonCard lines={3} />}>
          <LeadersStrip seasonId={id} />
        </Suspense>
      </BlockErrorBoundary>

      <div className="flex flex-wrap items-start gap-5">
        <BlockErrorBoundary title="Moyennes de l'équipe par quart-temps" className={AVERAGES_WIDTH}>
          <Suspense key={id} fallback={<SkeletonCard lines={6} className={AVERAGES_WIDTH} />}>
            <QuarterAveragesCard seasonId={id} className={AVERAGES_WIDTH} />
          </Suspense>
        </BlockErrorBoundary>
        <BlockErrorBoundary title="Effectif" className={ROSTER_WIDTH}>
          <Suspense key={id} fallback={<SkeletonCard lines={6} className={ROSTER_WIDTH} />}>
            <RosterCard seasonId={id} className={ROSTER_WIDTH} />
          </Suspense>
        </BlockErrorBoundary>
      </div>

      <BlockErrorBoundary title="Classements de la saison">
        <Suspense key={id} fallback={<SkeletonCard lines={5} />}>
          <RankingsSection seasonId={id} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
