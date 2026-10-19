import { formatPercent } from "@/lib/format";
import type { SeasonRecord } from "@/models/SeasonRecord";

type RecordSummaryProps = {
  record: SeasonRecord;
  /** Taux de victoire entre 0 et 1. */
  winRate: number;
};

/** Bilan écrit en toutes lettres : il ne repose jamais sur la couleur de l'anneau. */
export function RecordSummary({ record, winRate }: RecordSummaryProps) {
  const played = record.wins + record.losses;

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <p className="font-display text-3xl leading-none font-black tabular-nums">
        {record.wins} V – {record.losses} D
      </p>
      <p className="text-sm text-rpb-ink/72 tabular-nums">
        {formatPercent(winRate)} de victoires sur {played} {played > 1 ? "matchs" : "match"}
      </p>
      <ul className="flex gap-3.5 text-[13px] font-semibold">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-[3px] bg-success" />
          Victoires
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-[3px] bg-rpb-bordeaux" />
          Défaites
        </li>
      </ul>
    </div>
  );
}
