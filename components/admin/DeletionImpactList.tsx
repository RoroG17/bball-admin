import { useId } from "react";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { cx } from "@/lib/cx";
import type { DeletionImpact } from "@/models/DeletionImpact";
import { summarizeDeletionImpact } from "@/models/summarizeDeletionImpact";

type DeletionImpactListProps = { impact: DeletionImpact };

/**
 * Ce que la suppression emporte. Une ligne à 0 n'est jamais affichée ; un compteur inconnu l'est en toutes lettres
 * (icône + « nombre indéterminé »), jamais comme un 0.
 */
export function DeletionImpactList({ impact }: DeletionImpactListProps) {
  const headingId = useId();
  const summary = summarizeDeletionImpact(impact);
  const unknownKinds = new Set(impact.lines.filter((line) => line.count === null).map((line) => line.kind));

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="text-base font-bold">
        Seront aussi supprimés :
      </h3>
      {summary.isEmpty ? (
        <SummaryNotice tone="light" icon="check" message="Aucune autre donnée n'est liée à cet élément." />
      ) : (
        <ul className="flex flex-col border-t-2 border-rpb-ink">
          {summary.items.map((item) => {
            const unknown = unknownKinds.has(item.kind);
            return (
              <li
                key={item.kind}
                className={cx(
                  "flex items-start gap-3 border-b border-rpb-ink/12 py-2.5 text-base/6 tabular-nums",
                  unknown ? "bg-rpb-gold-light px-3 font-semibold" : "px-1 font-bold",
                )}
              >
                {unknown ? (
                  <InfoIcon size={18} className="mt-[3px] shrink-0" />
                ) : (
                  <span aria-hidden="true" className="mt-[7px] size-2.5 shrink-0 rounded-sm bg-rpb-bordeaux" />
                )}
                <span>{item.text}</span>
              </li>
            );
          })}
        </ul>
      )}
      {(summary.isIncomplete || summary.hasUnknown) && (
        <SummaryNotice
          tone="light"
          message="D'autres données liées peuvent aussi être supprimées. Le détail ci-dessus est un minimum."
        />
      )}
    </section>
  );
}
