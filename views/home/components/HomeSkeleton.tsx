import { SkeletonCard } from "@/components/ui/SkeletonCard";

/** Squelette pleine page, le temps de résoudre la session et les saisons. */
export function HomeSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <span className="sr-only">Chargement du tableau de bord…</span>
      <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-3 w-56 rounded-md bg-rpb-ink/9" />
          <div className="skeleton h-10 w-72 rounded-md bg-rpb-ink/9" />
        </div>
        <div className="skeleton h-[46px] w-full max-w-[340px] rounded-lg bg-rpb-ink/9" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard lines={3} />
      </div>
      <SkeletonCard lines={3} />
    </main>
  );
}
