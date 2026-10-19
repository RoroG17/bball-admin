import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { GAME_DETAIL_MAIN_CLASSES } from "@/views/game-detail/components/gameDetailLayout";

const BLOCK = "skeleton rounded-md bg-rpb-ink/9";

export function GameDetailSkeleton() {
  return (
    <main aria-busy="true" className={GAME_DETAIL_MAIN_CLASSES}>
      <span className="sr-only">Chargement du match…</span>
      <div aria-hidden="true" className={`${BLOCK} h-5 w-44`} />
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className={`${BLOCK} h-3 w-72 max-w-full`} />
          <div className={`${BLOCK} h-[31px] w-[min(100%,560px)] @2xl:h-[42px]`} />
        </div>
        <div className={`${BLOCK} h-9 w-60 max-w-full`} />
        <div className="skeleton h-[180px] rounded-lg bg-rpb-ink/9" />
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={12} />
    </main>
  );
}
