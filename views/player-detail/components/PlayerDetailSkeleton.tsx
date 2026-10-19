import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { PLAYER_DETAIL_MAIN_CLASSES } from "@/views/player-detail/components/playerDetailLayout";

export function PlayerDetailSkeleton() {
  return (
    <main aria-busy="true" className={PLAYER_DETAIL_MAIN_CLASSES}>
      <span className="sr-only">Chargement du joueur…</span>
      <div aria-hidden="true" className="skeleton h-5 w-44 rounded-md bg-rpb-ink/9" />
      <div className="flex flex-wrap items-stretch gap-5">
        <SkeletonCard lines={5} className="flex-[1_1_300px]" />
        <SkeletonCard tiles={6} className="flex-[1_1_300px]" />
        <SkeletonCard lines={3} className="flex-[1_1_300px]" />
        <SkeletonCard tiles={3} className="flex-[2_1_620px]" />
      </div>
      <div aria-hidden="true" className="skeleton h-12 w-[min(100%,360px)] rounded-md bg-rpb-ink/9" />
      <SkeletonCard lines={8} />
    </main>
  );
}
