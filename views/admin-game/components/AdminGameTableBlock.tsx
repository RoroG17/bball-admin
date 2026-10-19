import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminTable } from "@/components/admin/AdminTable";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { formatDate } from "@/lib/format";
import type { AdminGameRow } from "@/models/AdminGameRow";
import { GAME_COMPARATORS, compareAdminGameRows } from "@/models/adminGameComparators";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { GAME_LIST_BASE_PATH, GAME_LIST_SPEC } from "@/models/adminGameListSpec";
import type { AdminListQuery } from "@/models/AdminListQuery";
import type { AdminNotice } from "@/models/AdminNotice";
import { buildAdminGameCreateHref } from "@/models/buildAdminGameCreateHref";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { describeGameListCaption } from "@/models/describeGameListCaption";
import { filterAdminGameRows } from "@/models/filterAdminGameRows";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import type { Season } from "@/models/Season";
import { sortRows } from "@/models/sortRows";
import { toAdminGameRow } from "@/models/toAdminGameRow";
import { toggleSort } from "@/models/toggleSort";
import { listGamesAwaitingStats } from "@/repositories/AdminGameRepository";
import { listSeasonGames } from "@/repositories/GameRepository";
import { resolveRpbTeam } from "@/repositories/TeamRepository";
import { AdminGameResultCell } from "@/views/admin-game/components/AdminGameResultCell";
import { AdminGameRowActions } from "@/views/admin-game/components/AdminGameRowActions";
import { AdminGameStatsCell } from "@/views/admin-game/components/AdminGameStatsCell";
import { AdminGameTeamCell } from "@/views/admin-game/components/AdminGameTeamCell";

type AdminGameTableBlockProps = {
  season: Season;
  query: AdminListQuery;
  highlight: AdminNotice | null;
};

/**
 * Matchs d'une saison. Les matchs illisibles font échouer le bloc (jamais une liste vide trompeuse) ; l'appel `review`
 * (statistiques à saisir) et l'équipe RPB sont des lectures isolées qui se dégradent (« Non vérifié », pas de repère).
 */
export async function AdminGameTableBlock({ season, query, highlight }: AdminGameTableBlockProps) {
  const [games, awaiting, rpb] = await Promise.all([
    listSeasonGames(season.id),
    listGamesAwaitingStats(),
    resolveRpbTeam(season.teamId),
  ]);
  const rpbTeam = rpb.kind === "resolved" ? rpb.team : null;
  const today = getParisIsoDate(new Date());
  const rows = games.map((game) => toAdminGameRow(game, rpbTeam, today, awaiting));
  const visible = sortRows(filterAdminGameRows(rows, query.q), query.sort, GAME_COMPARATORS, compareAdminGameRows);
  const highlightId =
    highlight && (highlight.code === "created" || highlight.code === "updated") ? Number(highlight.ref) : null;
  const caption = describeGameListCaption(formatSeasonLabel(season), visible.length, rows.length, query.sort);

  if (visible.length === 0) {
    return rows.length === 0 ? (
      <AdminEmptyState
        kind="none"
        icon={<BallIcon size={40} strokeWidth={1.6} />}
        title={GAME_MESSAGES.emptyListTitle}
        text={GAME_MESSAGES.emptyListText}
        caption={caption}
        action={{ href: buildAdminGameCreateHref(season.id), label: "Créer un match" }}
      />
    ) : (
      <AdminEmptyState
        kind="noMatch"
        icon={<SearchIcon size={40} strokeWidth={1.6} />}
        title={GAME_MESSAGES.noMatchTitle(query.q)}
        caption={caption}
        action={{ href: buildAdminGameListHref(season.id), label: "Réinitialiser la recherche" }}
      />
    );
  }

  const columns: AdminColumn<AdminGameRow>[] = [
    {
      id: "round",
      header: "Journée",
      sortable: true,
      sticky: true,
      cell: (row) => <span className="font-bold tabular-nums">{row.entry.game.number}</span>,
    },
    {
      id: "date",
      header: "Date",
      sortable: true,
      cell: (row) => <span className="whitespace-nowrap">{formatDate(row.entry.game.date)}</span>,
    },
    {
      id: "home",
      header: "Domicile",
      cell: (row) => <AdminGameTeamCell name={row.entry.game.home.name} isRpb={row.entry.rpbSide === "home"} />,
    },
    {
      id: "away",
      header: "Extérieur",
      cell: (row) => <AdminGameTeamCell name={row.entry.game.away.name} isRpb={row.entry.rpbSide === "away"} />,
    },
    { id: "result", header: "Résultat", cell: (row) => <AdminGameResultCell entry={row.entry} /> },
    { id: "stats", header: "Statistiques", cell: (row) => <AdminGameStatsCell row={row} /> },
  ];

  return (
    <div className="flex flex-col gap-3">
      {awaiting === null && <SummaryNotice tone="light" message={GAME_MESSAGES.awaitingUnavailable} />}
      <AdminTable
        caption={caption}
        columns={columns}
        rows={visible}
        getRowKey={(row) => String(row.entry.game.id)}
        sort={query.sort}
        buildSortHref={(columnId) =>
          buildAdminListHref(
            GAME_LIST_BASE_PATH,
            { ...query, sort: toggleSort(query.sort, columnId), page: 1 },
            GAME_LIST_SPEC,
          )
        }
        rowActions={(row) => <AdminGameRowActions row={row} />}
        minWidth="lg"
        isRowHighlighted={(row) => row.entry.game.id === highlightId}
      />
    </div>
  );
}
