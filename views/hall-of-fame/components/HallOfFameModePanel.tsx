import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { HALL_OF_FAME_CATEGORIES } from "@/models/HallOfFameCategory";
import type { HallOfFameMode } from "@/models/HallOfFameMode";
import { HallOfFameCard } from "@/views/hall-of-fame/components/HallOfFameCard";

type HallOfFameModePanelProps = { mode: HallOfFameMode };

/** Les 9 cartes d'un mode ; chacune isole sa propre erreur de format. */
export function HallOfFameModePanel({ mode }: HallOfFameModePanelProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
      {HALL_OF_FAME_CATEGORIES.map((category) => (
        <BlockErrorBoundary key={category.key} title={category.title}>
          <HallOfFameCard categoryKey={category.key} mode={mode} />
        </BlockErrorBoundary>
      ))}
    </div>
  );
}
