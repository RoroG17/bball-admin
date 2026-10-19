import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminTable } from "@/components/admin/AdminTable";
import { GroupIcon } from "@/components/ui/icons/GroupIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { SelectField } from "@/components/ui/SelectField";
import type { AdminListQuery } from "@/models/AdminListQuery";
import type { AdminNotice } from "@/models/AdminNotice";
import type { AdminPlayer } from "@/models/AdminPlayer";
import { PLAYER_LIST_SPEC, PLAYER_TEAM_PLACEHOLDER } from "@/models/adminPlayerListSpec";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { describePlayerListCaption } from "@/models/describePlayerListCaption";
import { filterAdminPlayers } from "@/models/filterAdminPlayers";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { listPlayerTeams } from "@/models/listPlayerTeams";
import { parseTeamFilter } from "@/models/parseTeamFilter";
import { sortAdminPlayers } from "@/models/sortAdminPlayers";
import { toggleSort } from "@/models/toggleSort";
import { toTeamSelectOptions } from "@/models/toTeamSelectOptions";
import { listAdminPlayers } from "@/repositories/AdminPlayerRepository";
import { AdminPlayerBirthCell } from "@/views/admin-player/components/AdminPlayerBirthCell";
import { AdminPlayerIdentityCell } from "@/views/admin-player/components/AdminPlayerIdentityCell";
import { AdminPlayerRowActions } from "@/views/admin-player/components/AdminPlayerRowActions";
import { AdminPlayerTeamCell } from "@/views/admin-player/components/AdminPlayerTeamCell";

type AdminPlayerListBlockProps = {
  query: AdminListQuery;
  /** Notice après modification : la ligne du joueur est mise en évidence. */
  highlight: AdminNotice | null;
};

const BASE_PATH = buildAdminHref("player");

/**
 * Barre de recherche et liste des joueurs. Une lecture en échec fait échouer le bloc (« Réessayer ») : jamais une liste
 * vide trompeuse. Pas de pagination (D-P10).
 */
export async function AdminPlayerListBlock({ query, highlight }: AdminPlayerListBlockProps) {
  const players = await listAdminPlayers();
  const today = getParisIsoDate(new Date());
  const teamId = parseTeamFilter(query.filters.equipe);
  const visible = sortAdminPlayers(filterAdminPlayers(players, { q: query.q, teamId }), query.sort);
  const highlightLicence = highlight?.code === "updated" ? highlight.ref : null;
  const caption = describePlayerListCaption(visible.length, players.length, query.sort);
  const isFiltered = query.q !== "" || teamId !== null;

  const toolbar = (
    <AdminListToolbar
      basePath={BASE_PATH}
      query={query}
      spec={PLAYER_LIST_SPEC}
      searchLabel="Rechercher un joueur (nom ou licence)"
      isFiltered={isFiltered}
    >
      <SelectField
        name="equipe"
        label="Équipe"
        placeholder={PLAYER_TEAM_PLACEHOLDER}
        options={toTeamSelectOptions(listPlayerTeams(players))}
        defaultValue={query.filters.equipe}
      />
    </AdminListToolbar>
  );

  if (visible.length === 0) {
    return (
      <>
        {toolbar}
        {players.length === 0 ? (
          <AdminEmptyState
            kind="none"
            icon={<GroupIcon size={40} strokeWidth={1.6} />}
            title={ADMIN_PLAYER_MESSAGES.emptyNoneTitle}
            text={ADMIN_PLAYER_MESSAGES.emptyNoneText}
            caption={caption}
            action={{ href: buildAdminHref("player", "create"), label: "Créer un joueur" }}
          />
        ) : (
          <AdminEmptyState
            kind="noMatch"
            icon={<SearchIcon size={40} strokeWidth={1.6} />}
            title={ADMIN_PLAYER_MESSAGES.emptyNoMatchTitle}
            caption={caption}
            action={{ href: BASE_PATH, label: "Réinitialiser les filtres" }}
          />
        )}
      </>
    );
  }

  const columns: AdminColumn<AdminPlayer>[] = [
    {
      id: "nom",
      header: "Joueur",
      sortable: true,
      sticky: true,
      cell: (row) => (
        <AdminPlayerIdentityCell player={row.player} highlighted={row.player.licence === highlightLicence} />
      ),
    },
    { id: "licence", header: "Licence", sortable: true, cell: (row) => <span className="tabular-nums">{row.player.licence}</span> },
    { id: "equipe", header: "Équipe", sortable: true, cell: (row) => <AdminPlayerTeamCell team={row.team} /> },
    {
      id: "naissance",
      header: "Naissance",
      sortable: true,
      cell: (row) => <AdminPlayerBirthCell birthDate={row.personalInfo.birthDate} today={today} />,
    },
  ];

  return (
    <>
      {toolbar}
      <AdminTable
        caption={caption}
        columns={columns}
        rows={visible}
        getRowKey={(row) => row.player.licence}
        sort={query.sort}
        buildSortHref={(columnId) =>
          buildAdminListHref(BASE_PATH, { ...query, sort: toggleSort(query.sort, columnId), page: 1 }, PLAYER_LIST_SPEC)
        }
        rowActions={(row) => <AdminPlayerRowActions player={row.player} />}
        isRowHighlighted={(row) => row.player.licence === highlightLicence}
        minWidth="lg"
      />
    </>
  );
}
