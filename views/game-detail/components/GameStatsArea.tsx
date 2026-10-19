import { Suspense } from "react";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import type { CalendarGame } from "@/models/CalendarGame";
import { findDuplicatePlayers } from "@/models/findDuplicatePlayers";
import { getOpponentTeam } from "@/models/getOpponentTeam";
import { getAdminGameAlerts } from "@/models/getAdminGameAlerts";
import { getStatsAvailability } from "@/models/getStatsAvailability";
import type { GameVideo } from "@/models/GameVideo";
import { listGamePeriods } from "@/models/listGamePeriods";
import { splitOpponentLine } from "@/models/splitOpponentLine";
import { listGameStatLines } from "@/repositories/GameStatsRepository";
import { AdminGameAlerts } from "@/views/game-detail/components/AdminGameAlerts";
import { OpponentComparisonSection } from "@/views/game-detail/components/OpponentComparisonSection";
import { GameStatsEmptyState } from "@/views/game-detail/components/GameStatsEmptyState";
import { PlayerStatsSection } from "@/views/game-detail/components/PlayerStatsSection";
import { ShotChartSection } from "@/views/game-detail/components/ShotChartSection";
import { TeamQuarterStatsSection } from "@/views/game-detail/components/TeamQuarterStatsSection";
import { TeamShootingSection } from "@/views/game-detail/components/TeamShootingSection";

type GameStatsAreaProps = {
  gameId: number;
  overview: CalendarGame;
  video: GameVideo;
  isAdmin: boolean;
  currentLicence: string | null;
};

/** Zone des statistiques : un seul chargement des lignes, puis les blocs (ou l'état vide). */
export async function GameStatsArea({ gameId, overview, video, isAdmin, currentLicence }: GameStatsAreaProps) {
  const { playerLines: lines, opponentLines } = splitOpponentLine(await listGameStatLines(gameId));
  const duplicates = findDuplicatePlayers(lines);
  const availability = getStatsAvailability(overview.status, lines.length);
  const periods = listGamePeriods(lines);

  return (
    <div className="flex flex-col gap-7">
      {isAdmin && <AdminGameAlerts alerts={getAdminGameAlerts({ overview, video, lines, duplicates })} />}
      {availability !== "available" ? (
        <GameStatsEmptyState availability={availability} isAdmin={isAdmin} gameId={gameId} />
      ) : (
        <>
          <PlayerStatsSection lines={lines} periods={periods} duplicates={duplicates} currentLicence={currentLicence} />
          <OpponentComparisonSection playerLines={lines} opponentLines={opponentLines} opponentName={getOpponentTeam(overview)?.name ?? "Adversaire"} />
          <TeamQuarterStatsSection lines={lines} periods={periods} />
          <TeamShootingSection lines={lines} />
          <BlockErrorBoundary title="Carte des tirs">
            <Suspense key={gameId} fallback={<SkeletonCard lines={10} />}>
              <ShotChartSection gameId={gameId} lines={lines} opponentLines={opponentLines} periods={periods} currentLicence={currentLicence} />
            </Suspense>
          </BlockErrorBoundary>
        </>
      )}
    </div>
  );
}
