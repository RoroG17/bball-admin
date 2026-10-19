import { PLAYER_LIST_MAIN_CLASSES } from "@/views/player-list/components/playerListLayout";

const BLOCK = "skeleton rounded-md bg-rpb-ink/9";

export function PlayerListSkeleton() {
  return (
    <main aria-busy="true" className={PLAYER_LIST_MAIN_CLASSES}>
      <span className="sr-only">Chargement des joueurs…</span>
      <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className={`${BLOCK} h-3 w-56`} />
          <div className={`${BLOCK} h-10 w-[180px]`} />
        </div>
        <div className="skeleton h-[46px] w-full max-w-[340px] rounded-lg bg-rpb-ink/9" />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-4 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-5 shadow-card">
        <div className={`${BLOCK} h-[22px] w-[45%]`} />
        <div className="skeleton h-[52px] max-w-[480px] rounded-lg bg-rpb-ink/9" />
        <div className={`${BLOCK} h-3 w-32`} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton h-[84px] rounded-lg bg-rpb-ink/9" />
          ))}
        </div>
      </div>
    </main>
  );
}
