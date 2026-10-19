import { forbidden, notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { canViewPlayer } from "@/models/canViewPlayer";
import { formatPlayerSeasonParam } from "@/models/formatPlayerSeasonParam";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { getPlayerVisibility } from "@/models/getPlayerVisibility";
import { listVisiblePlayerTabs } from "@/models/listVisiblePlayerTabs";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { PLAYER_TAB_LABELS, PLAYER_TAB_PARAMS } from "@/models/PlayerTab";
import { resolvePlayerSeasons } from "@/models/resolvePlayerSeasons";
import { resolvePlayerSeasonSelection } from "@/models/resolvePlayerSeasonSelection";
import { resolvePlayerTab } from "@/models/resolvePlayerTab";
import { getPlayerProfile } from "@/repositories/PlayerRepository";
import { listPlayerStatSeasonIds } from "@/repositories/PlayerStatsRepository";
import { listAccessibleSeasons, listAllSeasons, listParticipationSeasonIds } from "@/repositories/SeasonRepository";
import { requireSession } from "@/repositories/SessionRepository";
import { ExamsTab } from "@/views/player-detail/components/ExamsTab";
import { PhysicalSummarySection } from "@/views/player-detail/components/PhysicalSummarySection";
import { PhysicalTab } from "@/views/player-detail/components/PhysicalTab";
import { PLAYER_DETAIL_MAIN_CLASSES } from "@/views/player-detail/components/playerDetailLayout";
import { PlayerDetailHeader } from "@/views/player-detail/components/PlayerDetailHeader";
import { PlayerIdentityCard } from "@/views/player-detail/components/PlayerIdentityCard";
import { PlayerSummarySection } from "@/views/player-detail/components/PlayerSummarySection";
import { PlayerTabsNav } from "@/views/player-detail/components/PlayerTabsNav";
import { StatisticsTab } from "@/views/player-detail/components/StatisticsTab";

type PlayerDetailViewProps = {
  /** Segment `[licence]` brut, non validé. */
  rawLicence: string;
  requestedSeason: string | undefined;
  requestedTab: string | undefined;
};

export async function PlayerDetailView({ rawLicence, requestedSeason, requestedTab }: PlayerDetailViewProps) {
  const licence = parsePlayerLicence(rawLicence);
  if (licence === null) notFound(); // P12 : aucun appel au back

  const session = await requireSession();

  // Un joueur ne consulte que sa propre fiche, jamais celle des autres.
  if (session.role !== "admin" && session.licence !== licence) forbidden();

  // P1 : règles de visibilité appliquées AVANT tout chargement de donnée sensible.
  const visibility = getPlayerVisibility(session, licence);
  const [profile, viewerSeasons, allSeasons, participationIds, statSeasonIds] = await Promise.all([
    getPlayerProfile(licence, { includePersonalInfo: visibility.personalInfo }),
    listAccessibleSeasons(session),
    listAllSeasons(session.token),
    listParticipationSeasonIds(licence, session.token),
    listPlayerStatSeasonIds(licence),
  ]);
  if (!profile) notFound();

  const isSelfOrAdmin = session.role === "admin" || session.licence === licence;
  const seasons = resolvePlayerSeasons({
    allSeasons,
    participationSeasonIds: participationIds,
    statSeasonIds: statSeasonIds ?? [],
    viewerSeasonIds: isSelfOrAdmin ? "all" : viewerSeasons.map((season) => season.id),
  });
  // Q3 : un coéquipier sans saison commune n'apprend même pas que le joueur existe.
  if (!canViewPlayer({ viewer: session, targetLicence: licence, sharedSeasonCount: seasons.length })) notFound();

  const selection = resolvePlayerSeasonSelection(seasons, requestedSeason);
  const tabs = listVisiblePlayerTabs(visibility);
  const tab = resolvePlayerTab(requestedTab, tabs);
  const seasonParam = formatPlayerSeasonParam(selection);
  const tabParam = tab === "statistics" ? undefined : PLAYER_TAB_PARAMS[tab];
  // L'URL reflète toujours ce qui est affiché (paramètre absent, invalide, hors périmètre ou onglet non autorisé).
  if (requestedSeason !== seasonParam || requestedTab !== tabParam) {
    redirect(buildPlayerHref(licence, { saison: seasonParam, onglet: tab }));
  }

  const today = getParisIsoDate(new Date());

  return (
    <main className={`anim ${PLAYER_DETAIL_MAIN_CLASSES}`}>
      <PlayerDetailHeader
        licence={licence}
        backSeasonParam={selection.kind === "season" ? String(selection.season.id) : undefined}
        isAdmin={visibility.adminActions}
      />
      <div className="flex flex-wrap items-stretch gap-5">
        <PlayerIdentityCard profile={profile} seasonLabels={seasons.map(formatSeasonLabel)} />
        <BlockErrorBoundary title="Synthèse" className="flex-[2_1_620px]">
          <Suspense
            key={licence}
            fallback={
              <>
                <SkeletonCard lines={5} className="flex-[1_1_300px]" />
                <SkeletonCard tiles={6} className="flex-[1_1_300px]" />
                <SkeletonCard lines={3} className="flex-[1_1_300px]" />
              </>
            }
          >
            <PlayerSummarySection
              licence={licence}
              seasons={seasons}
              selection={selection}
              showExamCount={visibility.exams}
              today={today}
            />
          </Suspense>
        </BlockErrorBoundary>
        {visibility.physical && (
          <BlockErrorBoundary title="Données physiques" className="flex-[2_1_620px]">
            <Suspense key={licence} fallback={<SkeletonCard tiles={3} className="flex-[2_1_620px]" />}>
              <PhysicalSummarySection licence={licence} />
            </Suspense>
          </BlockErrorBoundary>
        )}
      </div>
      <PlayerTabsNav licence={licence} tabs={tabs} activeTab={tab} seasonParam={seasonParam} />
      {/* `key` : sans elle, une erreur d'un onglet resterait affichée après un changement d'onglet ou de saison. */}
      <BlockErrorBoundary key={`${licence}:${tab}:${seasonParam}`} title={PLAYER_TAB_LABELS[tab]}>
        <Suspense fallback={<SkeletonCard lines={8} />}>
          {tab === "statistics" && (
            <StatisticsTab licence={licence} seasons={seasons} selection={selection} today={today} />
          )}
          {tab === "exams" && <ExamsTab licence={licence} isAdmin={visibility.adminActions} />}
          {tab === "physical" && <PhysicalTab licence={licence} isAdmin={visibility.adminActions} today={today} />}
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
