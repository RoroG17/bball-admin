import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { HALL_OF_FAME_CATEGORIES } from "@/models/HallOfFameCategory";

export function HallOfFameSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <span className="sr-only">Chargement du palmarès…</span>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="skeleton h-10 w-56 rounded-md bg-rpb-ink/9" />
        <div className="skeleton h-4 w-80 max-w-full rounded-md bg-rpb-ink/9" />
      </div>
      <div className="flex flex-col gap-5">
        <div aria-hidden="true" className="skeleton h-[60px] w-full max-w-[650px] rounded-lg bg-rpb-ink/9" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
          {HALL_OF_FAME_CATEGORIES.map((category) => (
            <SkeletonCard key={category.key} lines={12} />
          ))}
        </div>
      </div>
    </main>
  );
}
