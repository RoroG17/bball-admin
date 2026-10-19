import { SkeletonCard } from "@/components/ui/SkeletonCard";

/** Squelette de page admin : fil d'Ariane, titre et un bloc. La coquille (navigation) reste affichée. */
export function AdminPageSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="skeleton h-3.5 w-56 rounded-md bg-rpb-ink/9" />
        <div className="skeleton h-10 w-72 rounded-md bg-rpb-ink/9" />
      </div>
      <SkeletonCard lines={6} />
    </main>
  );
}
