import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { findAccessibleSeason } from "@/models/findAccessibleSeason";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { getAdminGameActions } from "@/models/getAdminGameActions";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { parseGameId } from "@/models/parseGameId";
import { toGameOverview } from "@/models/toGameOverview";
import { getGameDetail } from "@/repositories/GameRepository";
import { countGameStatLines } from "@/repositories/GameStatsRepository";
import { listAccessibleSeasons } from "@/repositories/SeasonRepository";
import { requireSession } from "@/repositories/SessionRepository";
import { GAME_DETAIL_MAIN_CLASSES } from "@/views/game-detail/components/gameDetailLayout";
import { GameDetailHeader } from "@/views/game-detail/components/GameDetailHeader";
import { GameScoreboard } from "@/views/game-detail/components/GameScoreboard";
import { GameStatsArea } from "@/views/game-detail/components/GameStatsArea";
import { GameVideoSection } from "@/views/game-detail/components/GameVideoSection";

type GameDetailViewProps = {
  /** Segment `[id]` brut, non validé. */
  rawGameId: string;
};

export async function GameDetailView({ rawGameId }: GameDetailViewProps) {
  const gameId = parseGameId(rawGameId);
  if (gameId === null) notFound(); // P10 : aucun appel au back

  const session = await requireSession();

  const [detail, seasons] = await Promise.all([getGameDetail(gameId), listAccessibleSeasons(session)]);
  if (!detail) notFound();
  // D2 : une saison hors périmètre donne la même page qu'un match inexistant.
  const season = findAccessibleSeason(seasons, detail.seasonId);
  if (!season) notFound();

  // Calculée une seule fois : les fonctions du modèle la reçoivent en paramètre.
  const today = getParisIsoDate(new Date());
  const overview = toGameOverview(detail.game, season.teamId, today);
  const isAdmin = session.role === "admin";
  // P1 : le rôle vient de la session serveur ; rien n'est rendu pour un joueur.
  const actions = isAdmin
    ? getAdminGameActions({ statLineCount: await countGameStatLines(gameId), video: detail.video })
    : [];

  return (
    <main className={`anim ${GAME_DETAIL_MAIN_CLASSES}`}>
      <GameDetailHeader gameId={gameId} seasonId={season.id} actions={actions} />
      <GameScoreboard overview={overview} seasonLabel={formatSeasonLabel(season)} />
      <GameVideoSection video={detail.video} overview={overview} />
      <BlockErrorBoundary title="Statistiques du match">
        <Suspense key={gameId} fallback={<SkeletonCard lines={12} />}>
          <GameStatsArea
            gameId={gameId}
            overview={overview}
            video={detail.video}
            isAdmin={isAdmin}
            currentLicence={session.licence}
          />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
