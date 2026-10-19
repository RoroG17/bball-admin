import { createSeason, updateSeason } from "@/actions/seasonActions";
import { AdminForm } from "@/components/admin/AdminForm";
import { buildAdminHref } from "@/models/buildAdminHref";
import { describeSeasonTeamHint } from "@/models/describeSeasonTeamHint";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { orderTeamsForSeason } from "@/models/orderTeamsForSeason";
import type { Season } from "@/models/Season";
import type { SeasonField } from "@/models/SeasonInput";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import { toSeasonFormValues } from "@/models/toSeasonFormValues";
import { countSeasonGames } from "@/repositories/SeasonImpactRepository";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { listTeams } from "@/repositories/TeamRepository";
import { SeasonFormFields } from "@/views/admin-season/components/SeasonFormFields";

type SeasonFormBlockProps =
  | { mode: "create"; token: string; season?: undefined }
  | { mode: "edit"; token: string; season: Season };

/**
 * Formulaire de saison. Les équipes sont indispensables : si leur lecture échoue, le bloc lève (boundary + « Réessayer »),
 * jamais un formulaire sans choix d'équipe (P10, D-S12). La saison sans équipe reconnue affiche l'option vide (P5).
 */
export async function SeasonFormBlock({ mode, season, token }: SeasonFormBlockProps) {
  const [teams, seasons, matchCount] = await Promise.all([
    listTeams(token),
    listAllSeasons(token),
    season ? countSeasonGames(season.id) : Promise.resolve(0),
  ]);
  const teamOptions = orderTeamsForSeason(teams, seasons).map((team) => ({ value: String(team.id), label: team.name }));

  const initial = toSeasonFormValues(season ?? null, teams, getParisIsoDate(new Date()));

  return (
    <AdminForm<SeasonField>
      action={mode === "edit" ? updateSeason : createSeason}
      submitLabel={mode === "edit" ? "Enregistrer les modifications" : "Créer la saison"}
      busyLabel={mode === "edit" ? "Enregistrement…" : "Création…"}
      cancelHref={buildAdminHref("season")}
    >
      {season && <input type="hidden" name="id" value={season.id} />}
      <SeasonFormFields
        initial={initial}
        teamOptions={teamOptions}
        teamHint={season ? describeSeasonTeamHint(matchCount) : SEASON_MESSAGES.teamFieldHint}
      />
    </AdminForm>
  );
}
