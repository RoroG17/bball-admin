import { createGame, updateGame } from "@/actions/gameActions";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminForm } from "@/components/admin/AdminForm";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { buildAdminHref } from "@/models/buildAdminHref";
import type { GameDetail } from "@/models/GameDetail";
import type { GameFormField } from "@/models/GameFormField";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import { toGameFormValues, type GameFormInitialValues } from "@/models/toGameFormValues";
import { toGameSeasonOptions } from "@/models/toGameSeasonOptions";
import { countGameStatLines } from "@/repositories/GameStatsRepository";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { listTeams } from "@/repositories/TeamRepository";
import { GameFormFields } from "@/views/admin-game/components/GameFormFields";
import { GameStatsNotice } from "@/views/admin-game/components/GameStatsNotice";

type GameFormBlockProps =
  | { mode: "create"; token: string; requestedSeason: string | undefined; detail?: undefined }
  | { mode: "edit"; token: string; detail: GameDetail; requestedSeason?: undefined };

/**
 * Formulaire de match. Saisons et équipes (et le nombre de lignes de statistiques en modification) sont indispensables :
 * si une lecture échoue le bloc lève (boundary + « Réessayer »), jamais un formulaire sans choix (P5). Sans saison, la
 * création n'a pas de sens : l'état vide renvoie vers l'administration des saisons.
 */
export async function GameFormBlock({ token, requestedSeason, detail }: GameFormBlockProps) {
  const [seasons, teams, statLineCount] = await Promise.all([
    listAllSeasons(token),
    listTeams(token),
    detail ? countGameStatLines(detail.game.id) : Promise.resolve(0),
  ]);
  const seasonOptions = toGameSeasonOptions(seasons, teams);

  if (detail) {
    const season = seasons.find((candidate) => candidate.id === detail.seasonId);
    // Impossible par clé étrangère : erreur de page plutôt qu'un formulaire incohérent.
    if (!season) throw new Error("Saison du match introuvable.");
    const { values, teamsMode } = toGameFormValues(detail, season);
    return (
      <>
        <GameStatsNotice statLineCount={statLineCount} />
        <AdminForm<GameFormField>
          action={updateGame}
          submitLabel="Enregistrer les modifications"
          busyLabel="Enregistrement…"
          cancelHref={buildAdminGameListHref(detail.seasonId)}
        >
          <input type="hidden" name="gameId" value={detail.game.id} />
          <GameFormFields
            mode="update"
            seasons={seasonOptions}
            teams={teams}
            values={values}
            teamsMode={teamsMode}
            fixedTeams={{ home: detail.game.home.name, away: detail.game.away.name }}
            video={detail.video}
          />
        </AdminForm>
      </>
    );
  }

  const season = resolveSelectedSeason(seasons, requestedSeason);
  if (season === null) {
    return (
      <AdminEmptyState
        kind="none"
        icon={<CalendarIcon size={40} strokeWidth={1.6} />}
        title={GAME_MESSAGES.noSeasonTitle}
        text={GAME_MESSAGES.noSeasonText}
        action={{ href: buildAdminHref("season", "create"), label: "Créer une saison" }}
      />
    );
  }
  const values: GameFormInitialValues = {
    seasonId: String(season.id),
    round: "",
    date: "",
    side: "",
    opponentId: "",
    homeScore: "",
    awayScore: "",
    video: "",
  };
  return (
    <AdminForm<GameFormField>
      action={createGame}
      submitLabel="Créer le match"
      busyLabel="Création…"
      cancelHref={buildAdminGameListHref(season.id)}
    >
      <GameFormFields mode="create" seasons={seasonOptions} teams={teams} values={values} teamsMode="rpb" />
    </AdminForm>
  );
}
