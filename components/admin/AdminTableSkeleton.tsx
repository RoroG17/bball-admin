type AdminTableSkeletonProps = {
  /** Nombre de lignes de 65 px (6 par défaut). */
  rows?: number;
};

/** Squelette d'un tableau : mêmes dimensions que le tableau chargé (lignes de 65 px). */
export function AdminTableSkeleton({ rows = 6 }: AdminTableSkeletonProps) {
  return (
    <div aria-busy="true" className="rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream shadow-card">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden="true" className="px-4 pt-4 pb-3.5">
        <div className="skeleton h-3.5 w-[38%] rounded-md bg-rpb-ink/9" />
      </div>
      <div aria-hidden="true" className="border-t-2 border-rpb-ink">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex h-[65px] items-center gap-3 border-t border-rpb-ink/12 px-4 first:border-t-0"
          >
            <div className="skeleton size-10 shrink-0 rounded-full bg-rpb-ink/9" />
            <div className="skeleton h-4 flex-1 rounded-md bg-rpb-ink/9" />
            <div className="skeleton hidden h-8 w-24 shrink-0 rounded-md bg-rpb-ink/9 sm:block" />
            <div className="skeleton h-8 w-[84px] shrink-0 rounded-md bg-rpb-ink/9" />
          </div>
        ))}
      </div>
    </div>
  );
}
