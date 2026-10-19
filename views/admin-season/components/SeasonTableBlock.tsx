import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminTable } from "@/components/admin/AdminTable";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import type { AdminListQuery } from "@/models/AdminListQuery";
import type { AdminNotice } from "@/models/AdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { buildSeasonRows } from "@/models/buildSeasonRows";
import { describeSeasonListCaption } from "@/models/describeSeasonListCaption";
import { filterSeasonRows } from "@/models/filterSeasonRows";
import { SEASON_LIST_SPEC } from "@/models/seasonListSpec";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import type { SeasonRow } from "@/models/SeasonRow";
import { sortSeasonRows } from "@/models/sortSeasonRows";
import { toggleSort } from "@/models/toggleSort";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { resolveTeams } from "@/repositories/TeamRepository";
import { SeasonLabelCell } from "@/views/admin-season/components/SeasonLabelCell";
import { SeasonRowActions } from "@/views/admin-season/components/SeasonRowActions";
import { SeasonTeamCell } from "@/views/admin-season/components/SeasonTeamCell";

type SeasonTableBlockProps = {
  query: AdminListQuery;
  token: string;
  highlight: AdminNotice | null;
};

const BASE_PATH = buildAdminHref("season");

/**
 * Liste des saisons. Les saisons illisibles font échouer le bloc (jamais une liste vide trompeuse) ; les équipes
 * illisibles dégradent seulement la colonne « Équipe RPB » (« Équipe n° X », D-S12).
 */
export async function SeasonTableBlock({ query, token, highlight }: SeasonTableBlockProps) {
  const [seasons, teams] = await Promise.all([listAllSeasons(token), resolveTeams(token)]);
  const rows = buildSeasonRows(seasons, teams);
  const visible = sortSeasonRows(filterSeasonRows(rows, query.q), query.sort);
  const highlightId =
    highlight && (highlight.code === "created" || highlight.code === "updated") ? Number(highlight.ref) : null;
  const caption = describeSeasonListCaption(visible.length, rows.length, query.sort);

  if (visible.length === 0) {
    return rows.length === 0 ? (
      <AdminEmptyState
        kind="none"
        icon={<CalendarIcon size={40} strokeWidth={1.6} />}
        title={SEASON_MESSAGES.emptyListTitle}
        text={SEASON_MESSAGES.emptyListText}
        caption={caption}
        action={{ href: buildAdminHref("season", "create"), label: "Créer une saison" }}
      />
    ) : (
      <AdminEmptyState
        kind="noMatch"
        icon={<SearchIcon size={40} strokeWidth={1.6} />}
        title={SEASON_MESSAGES.noMatchTitle(query.q)}
        caption={caption}
        action={{ href: BASE_PATH, label: "Réinitialiser la recherche" }}
      />
    );
  }

  const columns: AdminColumn<SeasonRow>[] = [
    {
      id: "year",
      header: "Saison",
      sortable: true,
      sticky: true,
      cell: (row) => <SeasonLabelCell row={row} highlighted={row.season.id === highlightId} />,
    },
    { id: "championship", header: "Championnat", sortable: true, cell: (row) => row.season.championship || "—" },
    { id: "category", header: "Catégorie", sortable: true, cell: (row) => row.season.category || "—" },
    { id: "team", header: "Équipe RPB", sortable: true, cell: (row) => <SeasonTeamCell cell={row.team} /> },
  ];

  return (
    <div className="flex flex-col gap-3">
      {teams.kind === "unavailable" && <SummaryNotice tone="light" message={SEASON_MESSAGES.teamsNamesUnavailable} />}
      <AdminTable
        caption={caption}
        columns={columns}
        rows={visible}
        getRowKey={(row) => String(row.season.id)}
        sort={query.sort}
        buildSortHref={(columnId) =>
          buildAdminListHref(BASE_PATH, { ...query, sort: toggleSort(query.sort, columnId), page: 1 }, SEASON_LIST_SPEC)
        }
        rowActions={(row) => <SeasonRowActions seasonId={row.season.id} label={row.label} />}
        isRowHighlighted={(row) => row.season.id === highlightId}
      />
    </div>
  );
}
