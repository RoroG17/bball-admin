import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/ui/icons/ChartIcon";
import { computeSeasonSummary } from "@/models/computeSeasonSummary";
import { toCalendarGame } from "@/models/toCalendarGame";
import { listSeasonGames } from "@/repositories/GameRepository";
import { resolveRpbTeam } from "@/repositories/TeamRepository";
import { SeasonSummaryBanner } from "@/views/calendar/components/SeasonSummaryBanner";
import { SummaryNotice } from "@/components/ui/SummaryNotice";

type SeasonSummarySectionProps = {
  seasonId: number;
  teamId: number | null;
  today: string;
};

const TITLE = "Bilan de la saison";

/** Bloc « Bilan de la saison », calculé sur les mêmes entrées que la liste des matchs. */
export async function SeasonSummarySection({ seasonId, teamId, today }: SeasonSummarySectionProps) {
  const [games, resolution] = await Promise.all([listSeasonGames(seasonId), resolveRpbTeam(teamId)]);

  // Équipe RPB injoignable : le bloc passe en erreur (« Réessayer »), la liste reste affichée.
  if (resolution.kind === "unavailable") throw new Error("rpb-team-unavailable");

  if (games.length === 0) {
    return (
      <Card title={TITLE} animation="reveal" delayMs={80}>
        <EmptyState icon={<ChartIcon size={40} strokeWidth={1.6} />} title="Aucun match programmé sur cette saison." />
      </Card>
    );
  }

  if (resolution.kind === "notConfigured") {
    return (
      <Card title={TITLE} animation="reveal" delayMs={80}>
        <SummaryNotice tone="light" message="Bilan non calculable : aucune équipe RPB n'est associée à cette saison." />
      </Card>
    );
  }

  const summary = computeSeasonSummary(games.map((game) => toCalendarGame(game, resolution.team, today)));
  return <SeasonSummaryBanner title={TITLE} summary={summary} />;
}
