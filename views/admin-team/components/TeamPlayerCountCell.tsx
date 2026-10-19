import { pluralize } from "@/lib/format";

type TeamPlayerCountCellProps = {
  /** `null` : joueurs illisibles, indicateur indisponible. */
  count: number | null;
};

export function TeamPlayerCountCell({ count }: TeamPlayerCountCellProps) {
  if (count === null) {
    return (
      <span>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Indisponible</span>
      </span>
    );
  }
  if (count === 0) return <span className="text-rpb-ink/72">Aucun joueur</span>;
  return <span className="tabular-nums">{pluralize(count, "joueur", "joueurs")}</span>;
}
