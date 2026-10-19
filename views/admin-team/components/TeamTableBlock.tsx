import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminTable } from "@/components/admin/AdminTable";
import { GroupIcon } from "@/components/ui/icons/GroupIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import type { AdminListQuery } from "@/models/AdminListQuery";
import type { AdminNotice } from "@/models/AdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { buildTeamListRows } from "@/models/buildTeamListRows";
import { describeTeamListCaption } from "@/models/describeTeamListCaption";
import { queryTeamRows } from "@/models/queryTeamRows";
import { TEAM_LIST_SPEC } from "@/models/teamList";
import type { TeamListRow } from "@/models/TeamListRow";
import { TEAM_MESSAGES } from "@/models/teamMessages";
import { toggleSort } from "@/models/toggleSort";
import { listAllPlayers } from "@/repositories/PlayerRepository";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { readOrNull } from "@/repositories/support/readOrNull";
import { listTeams } from "@/repositories/TeamRepository";
import { TeamClubBadge } from "@/views/admin-team/components/TeamClubBadge";
import { TeamLogoFileCell } from "@/views/admin-team/components/TeamLogoFileCell";
import { TeamNameCell } from "@/views/admin-team/components/TeamNameCell";
import { TeamPlayerCountCell } from "@/views/admin-team/components/TeamPlayerCountCell";
import { TeamRowActions } from "@/views/admin-team/components/TeamRowActions";

type TeamTableBlockProps = {
  query: AdminListQuery;
  token: string;
  highlight: AdminNotice | null;
};

const BASE_PATH = buildAdminHref("team");

/**
 * Liste des équipes. Les équipes illisibles font échouer le bloc (jamais une liste vide trompeuse) ; les indicateurs
 * d'usage (saisons, joueurs) sont dégradés en « — » sans masquer la liste.
 */
export async function TeamTableBlock({ query, token, highlight }: TeamTableBlockProps) {
  const [teams, seasons, players] = await Promise.all([
    listTeams(token),
    readOrNull(() => listAllSeasons(token)),
    readOrNull(() => listAllPlayers()),
  ]);
  const rows = buildTeamListRows(teams, seasons, players);
  const visible = queryTeamRows(rows, query);
  const highlightId =
    highlight && (highlight.code === "created" || highlight.code === "updated") ? Number(highlight.ref) : null;
  const caption = describeTeamListCaption(visible.length, rows.length, query.sort);

  if (visible.length === 0) {
    return rows.length === 0 ? (
      <AdminEmptyState
        kind="none"
        icon={<GroupIcon size={40} strokeWidth={1.6} />}
        title="Aucune équipe. Crée la première."
        caption={caption}
        action={{ href: buildAdminHref("team", "create"), label: "Nouvelle équipe" }}
      />
    ) : (
      <AdminEmptyState
        kind="noMatch"
        icon={<SearchIcon size={40} strokeWidth={1.6} />}
        title="Aucune équipe ne correspond."
        caption={caption}
        action={{ href: BASE_PATH, label: "Réinitialiser les filtres" }}
      />
    );
  }

  const columns: AdminColumn<TeamListRow>[] = [
    {
      id: "name",
      header: "Équipe",
      sortable: true,
      sticky: true,
      cell: (row) => <TeamNameCell row={row} highlighted={row.team.id === highlightId} />,
    },
    { id: "logo", header: "Fichier du logo", cell: (row) => <TeamLogoFileCell file={row.team.logoFile} /> },
    { id: "club", header: "Type", sortable: true, cell: (row) => <TeamClubBadge seasons={row.clubSeasons} /> },
    {
      id: "players",
      header: "Joueurs",
      sortable: true,
      align: "end",
      cell: (row) => <TeamPlayerCountCell count={row.playerCount} />,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {(seasons === null || players === null) && <SummaryNotice tone="light" message={TEAM_MESSAGES.usageUnavailable} />}
      <AdminTable
        caption={caption}
        columns={columns}
        rows={visible}
        getRowKey={(row) => String(row.team.id)}
        sort={query.sort}
        buildSortHref={(columnId) =>
          buildAdminListHref(BASE_PATH, { ...query, sort: toggleSort(query.sort, columnId), page: 1 }, TEAM_LIST_SPEC)
        }
        rowActions={(row) => <TeamRowActions team={row.team} />}
        isRowHighlighted={(row) => row.team.id === highlightId}
      />
    </div>
  );
}
