import type { AdminGameAlert } from "@/models/AdminGameAlert";
import type { CalendarGame } from "@/models/CalendarGame";
import { computeScoreGap } from "@/models/computeScoreGap";
import { computeTeamTotals } from "@/models/computeTeamTotals";
import type { DuplicatePlayer } from "@/models/DuplicatePlayer";
import type { GameVideo } from "@/models/GameVideo";
import type { PlayerGameStats } from "@/models/PlayerGameStats";

type AlertInput = {
  overview: CalendarGame;
  video: GameVideo;
  lines: readonly PlayerGameStats[];
  duplicates: readonly DuplicatePlayer[];
};

/** Points à vérifier par l'admin, dans l'ordre d'affichage. */
export function getAdminGameAlerts({ overview, video, lines, duplicates }: AlertInput): AdminGameAlert[] {
  const alerts: AdminGameAlert[] = [];
  if (overview.status === "scoreMissing") alerts.push({ kind: "scoreMissing" });
  if (overview.status !== "upcoming" && lines.length === 0) alerts.push({ kind: "statsMissing" });
  if (duplicates.length > 0) alerts.push({ kind: "duplicatePlayers", players: [...duplicates] });
  if (lines.length > 0) {
    const gap = computeScoreGap(overview, computeTeamTotals(lines, "all").points);
    if (gap !== null && gap.difference !== 0) alerts.push({ kind: "scoreGap", gap });
  }
  if (video.kind === "invalid") alerts.push({ kind: "invalidVideo", raw: video.raw });
  if (overview.rpbSide === null) alerts.push({ kind: "rpbSideUnknown" });
  return alerts;
}
