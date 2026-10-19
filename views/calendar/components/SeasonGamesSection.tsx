import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { animationDelay } from "@/lib/animationDelay";
import { buildSeasonCalendar } from "@/models/buildSeasonCalendar";
import { listSeasonGames } from "@/repositories/GameRepository";
import { resolveRpbTeam } from "@/repositories/TeamRepository";
import { GameListSection } from "@/views/calendar/components/GameListSection";
import { NextGameCard } from "@/views/calendar/components/NextGameCard";
import { SummaryNotice } from "@/components/ui/SummaryNotice";

type SeasonGamesSectionProps = {
  seasonId: number;
  teamId: number | null;
  today: string;
};

/** Prochain match, puis « À venir », puis « Résultats ». */
export async function SeasonGamesSection({ seasonId, teamId, today }: SeasonGamesSectionProps) {
  const [games, resolution] = await Promise.all([listSeasonGames(seasonId), resolveRpbTeam(teamId)]);

  if (games.length === 0) {
    return (
      <Card title="Matchs de la saison" animation="reveal" delayMs={200}>
        <EmptyState
          icon={<CalendarIcon size={40} strokeWidth={1.6} />}
          title="Aucun match pour cette saison."
          text="Les matchs apparaîtront ici dès qu'ils seront programmés."
        />
      </Card>
    );
  }

  const rpbTeam = resolution.kind === "resolved" ? resolution.team : null;
  const { next, upcoming, results } = buildSeasonCalendar(games, rpbTeam, today);

  return (
    <div className="flex flex-col gap-7">
      {resolution.kind === "unavailable" && (
        <div className="reveal" style={animationDelay(160)}>
          <SummaryNotice
            tone="light"
            message="Victoires, défaites et domicile / extérieur indisponibles pour le moment."
          />
        </div>
      )}
      {next && <NextGameCard entry={next} today={today} />}
      <GameListSection
        title="À venir"
        entries={upcoming}
        emptyText={next ? "Aucun autre match à venir." : "Aucun match à venir : la saison est terminée."}
      />
      <GameListSection title="Résultats" entries={results} emptyText="Aucun match joué pour l'instant." />
    </div>
  );
}
