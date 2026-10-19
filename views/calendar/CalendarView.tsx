import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";
import { listAccessibleSeasons } from "@/repositories/SeasonRepository";
import { requireSession } from "@/repositories/SessionRepository";
import { CalendarHeader } from "@/views/calendar/components/CalendarHeader";
import { CalendarNoSeasonState } from "@/views/calendar/components/CalendarNoSeasonState";
import { SeasonGamesSection } from "@/views/calendar/components/SeasonGamesSection";
import { SeasonSummarySection } from "@/views/calendar/components/SeasonSummarySection";

type CalendarViewProps = {
  /** Valeur brute du paramètre `?saison=`, non validée. */
  requestedSeasonId: string | undefined;
};

const MAIN_CLASSES = "anim mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16";

export async function CalendarView({ requestedSeasonId }: CalendarViewProps) {
  const session = await requireSession();

  const seasons = sortSeasonsByRecency(await listAccessibleSeasons(session));
  const selected = resolveSelectedSeason(seasons, requestedSeasonId);
  if (!selected) {
    return (
      <main className={MAIN_CLASSES}>
        <CalendarNoSeasonState />
      </main>
    );
  }

  // L'URL reflète toujours la saison affichée (paramètre absent, invalide ou hors périmètre d'un joueur).
  if (requestedSeasonId !== String(selected.id)) redirect(`/game?saison=${selected.id}`);

  const id = selected.id;
  // Calculée une seule fois : les fonctions du modèle la reçoivent en paramètre.
  const today = getParisIsoDate(new Date());
  const options = seasons.map((season) => ({ id: season.id, label: formatSeasonLabel(season) }));

  return (
    <main className={MAIN_CLASSES}>
      <CalendarHeader options={options} selectedSeasonId={id} selectedSeasonLabel={formatSeasonLabel(selected)} />

      <BlockErrorBoundary title="Bilan de la saison">
        <Suspense key={id} fallback={<SkeletonCard tiles={6} />}>
          <SeasonSummarySection seasonId={id} teamId={selected.teamId} today={today} />
        </Suspense>
      </BlockErrorBoundary>

      <BlockErrorBoundary title="Matchs de la saison">
        <Suspense
          key={id}
          fallback={
            <div className="flex flex-col gap-7">
              <SkeletonCard lines={4} />
              <SkeletonCard lines={7} />
            </div>
          }
        >
          <SeasonGamesSection seasonId={id} teamId={selected.teamId} today={today} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
