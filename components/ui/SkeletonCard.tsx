import { cx } from "@/lib/cx";

type SkeletonCardProps = {
  /** Nombre total de lignes : titre + lignes avatar + ligne de pied. */
  lines?: number;
  /** Si défini : disposition « tuiles » (le premier bloc deux fois plus large) au lieu des lignes. */
  tiles?: number;
  /** Si défini : grille de cartes de joueur (84 px de haut) au lieu des lignes. */
  cards?: number;
  className?: string;
};

export function SkeletonCard({ lines = 4, tiles, cards, className }: SkeletonCardProps) {
  const rows = Math.max(1, lines - 2);

  return (
    <div
      aria-busy="true"
      className={cx(
        "flex min-w-0 flex-col gap-4 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-5 shadow-card",
        className,
      )}
    >
      <span className="sr-only">Chargement…</span>
      <div aria-hidden="true" className="skeleton h-[22px] w-[45%] rounded-md bg-rpb-ink/9" />
      {cards !== undefined ? (
        <div
          aria-hidden="true"
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3"
        >
          {Array.from({ length: cards }, (_, index) => (
            <div key={index} className="skeleton h-[84px] rounded-lg bg-rpb-ink/9" />
          ))}
        </div>
      ) : tiles !== undefined ? (
        <div aria-hidden="true" className="flex flex-wrap gap-3">
          {Array.from({ length: tiles }, (_, index) => (
            <div
              key={index}
              className={cx("skeleton h-24 rounded-lg bg-rpb-ink/9", index === 0 ? "flex-[2_1_200px]" : "flex-[1_1_130px]")}
            />
          ))}
        </div>
      ) : (
        <>
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} aria-hidden="true" className="flex items-center gap-3">
              <div className="skeleton size-10 shrink-0 rounded-full bg-rpb-ink/9" />
              <div className="skeleton h-4 flex-1 rounded-md bg-rpb-ink/9" />
              <div className="skeleton h-8 w-10 shrink-0 rounded-md bg-rpb-ink/9" />
            </div>
          ))}
          <div aria-hidden="true" className="skeleton h-3.5 w-[65%] rounded-md bg-rpb-ink/9" />
        </>
      )}
    </div>
  );
}
