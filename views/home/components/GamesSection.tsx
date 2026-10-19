import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { CalendarCheckIcon } from "@/components/ui/icons/CalendarCheckIcon";
import { getGameOutcome } from "@/models/getGameOutcome";
import { getRpbSide } from "@/models/getRpbSide";
import { isToday } from "@/models/isToday";
import { getPreviousAndNextGames } from "@/repositories/GameRepository";
import { getTeamName } from "@/repositories/TeamRepository";
import { PlayedGameCard } from "@/views/home/components/PlayedGameCard";
import { UpcomingGameCard } from "@/views/home/components/UpcomingGameCard";

type GamesSectionProps = {
  seasonId: number;
  /** Équipe RPB de la saison, pour savoir de quel côté elle joue. */
  teamId: number | null;
};

/** Dernier match et prochain match : deux emplacements indépendants, chacun avec son état vide. */
export async function GamesSection({ seasonId, teamId }: GamesSectionProps) {
  const [{ previous, next }, rpbTeamName] = await Promise.all([
    getPreviousAndNextGames(seasonId),
    getTeamName(teamId),
  ]);

  return (
    <>
      {previous ? (
        <PlayedGameCard
          game={previous}
          outcome={getGameOutcome(previous, getRpbSide(previous, rpbTeamName))}
          rpbSide={getRpbSide(previous, rpbTeamName)}
          isToday={isToday(previous.date, new Date())}
        />
      ) : (
        <Card title="Dernier match" titleStyle="eyebrow" animation="reveal" delayMs={160}>
          <EmptyState
            icon={<BallIcon size={40} />}
            title="Aucun match joué pour l'instant"
            text="Le score du premier match apparaîtra ici."
          />
        </Card>
      )}
      {next ? (
        <UpcomingGameCard game={next} rpbSide={getRpbSide(next, rpbTeamName)} />
      ) : (
        <Card title="Prochain match" titleStyle="eyebrow" animation="reveal" delayMs={240}>
          <EmptyState
            icon={<CalendarCheckIcon size={40} strokeWidth={1.6} />}
            title="Aucun match à venir"
            text="La saison est terminée."
          />
        </Card>
      )}
    </>
  );
}
