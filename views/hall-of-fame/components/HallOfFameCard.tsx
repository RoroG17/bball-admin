import { Card } from "@/components/ui/Card";
import { CardSubtitle } from "@/components/ui/CardSubtitle";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { describeHallOfFameMode } from "@/models/describeHallOfFameMode";
import { getPendingBackFix } from "@/models/getPendingBackFix";
import type { HallOfFameCategoryKey } from "@/models/HallOfFameCategory";
import type { HallOfFameMode } from "@/models/HallOfFameMode";
import { getHallOfFameStat } from "@/repositories/HallOfFameRepository";
import { HallOfFameTable } from "@/views/hall-of-fame/components/HallOfFameTable";

type HallOfFameCardProps = {
  categoryKey: HallOfFameCategoryKey;
  mode: HallOfFameMode;
};

export async function HallOfFameCard({ categoryKey, mode }: HallOfFameCardProps) {
  const { category, rankings } = await getHallOfFameStat(categoryKey);
  const entries = rankings[mode];
  const pendingFix = getPendingBackFix(categoryKey, mode);

  const subtitle = (
    <div className="flex flex-col gap-0.5">
      <CardSubtitle>{describeHallOfFameMode(mode, category.kind)}</CardSubtitle>
      {category.lowerIsBetter ? (
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-rpb-bordeaux">
          <InfoIcon size={14} className="shrink-0" />
          {category.scopeNote}
        </p>
      ) : (
        category.scopeNote && <CardSubtitle>{category.scopeNote}</CardSubtitle>
      )}
    </div>
  );

  return (
    <Card title={category.title} titleLevel={2} titleStyle="ranking" tight subtitle={subtitle}>
      {pendingFix && <SummaryNotice tone="light" message={pendingFix.notice} />}
      {entries.length === 0 ? (
        <p className="py-2 text-sm text-rpb-ink/72">Aucune donnée</p>
      ) : (
        <HallOfFameTable entries={entries} category={category} mode={mode} />
      )}
    </Card>
  );
}
