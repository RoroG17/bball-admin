import Link from "next/link";
import { cx } from "@/lib/cx";
import { LOG_KIND_LABELS, type LogKind } from "@/models/LogKind";
import { buildLogListHref } from "@/models/buildLogListHref";

type LogKindTabsProps = { kinds: readonly LogKind[]; current: LogKind };

/** Onglets Erreurs / Requêtes. Rien n'est rendu avec un seul type. Changer de type réinitialise filtres, page et détail. */
export function LogKindTabs({ kinds, current }: LogKindTabsProps) {
  if (kinds.length < 2) return null;
  return (
    <nav aria-label="Type de journal" className="flex flex-wrap gap-1 border-b-2 border-rpb-ink/14">
      {kinds.map((kind) => (
        <Link
          key={kind}
          href={buildLogListHref({ kind, filters: {}, page: 1, detailId: null })}
          prefetch={false}
          aria-current={kind === current ? "page" : undefined}
          className={cx(
            "-mb-0.5 inline-flex min-h-12 items-center border-b-4 px-4 text-[15px] no-underline transition-colors focus-ring",
            kind === current
              ? "border-rpb-bordeaux font-extrabold text-rpb-bordeaux"
              : "border-transparent font-semibold text-rpb-ink hover:border-rpb-ink/30 hover:bg-rpb-gold-light",
          )}
        >
          {LOG_KIND_LABELS[kind].tab}
        </Link>
      ))}
    </nav>
  );
}
