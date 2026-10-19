import { SkeletonCard } from "@/components/ui/SkeletonCard";

export function CalendarSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <span className="sr-only">Chargement du calendrier…</span>
      <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-3 w-56 rounded-md bg-rpb-ink/9" />
          <div className="skeleton h-10 w-56 rounded-md bg-rpb-ink/9" />
        </div>
        <div className="skeleton h-[46px] w-full max-w-[340px] rounded-lg bg-rpb-ink/9" />
      </div>
      <SkeletonCard tiles={6} />
      <div className="flex flex-col gap-7">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={7} />
      </div>
    </main>
  );
}
