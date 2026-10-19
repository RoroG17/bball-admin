import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { SelectField } from "@/components/ui/SelectField";
import type { AdminListQuery } from "@/models/AdminListQuery";
import { GAME_LIST_BASE_PATH, GAME_LIST_SPEC } from "@/models/adminGameListSpec";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import type { Season } from "@/models/Season";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";

type AdminGameToolbarProps = { season: Season; seasons: readonly Season[]; query: AdminListQuery };

/** Recherche d'équipe et sélecteur de saison : un formulaire GET, sans JavaScript (la saison est dans l'URL, D-G1). */
export function AdminGameToolbar({ season, seasons, query }: AdminGameToolbarProps) {
  return (
    <AdminListToolbar
      basePath={GAME_LIST_BASE_PATH}
      query={query}
      spec={GAME_LIST_SPEC}
      searchLabel="Rechercher une équipe"
      isFiltered={query.q !== ""}
    >
      <SelectField
        name="saison"
        label="Saison"
        defaultValue={String(season.id)}
        options={sortSeasonsByRecency(seasons).map((candidate) => ({
          value: String(candidate.id),
          label: formatSeasonLabel(candidate),
        }))}
      />
    </AdminListToolbar>
  );
}
