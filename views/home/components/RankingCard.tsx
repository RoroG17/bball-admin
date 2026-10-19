import { Card } from "@/components/ui/Card";
import { CardSubtitle } from "@/components/ui/CardSubtitle";
import { Disclosure } from "@/components/ui/Disclosure";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { isSharedRank } from "@/models/isSharedRank";
import type { Ranking } from "@/models/Ranking";
import { RankingCompactRow } from "@/views/home/components/RankingCompactRow";
import { RankingRow } from "@/views/home/components/RankingRow";

type RankingCardProps = {
  ranking: Ranking;
  visibleCount?: number;
};

export function RankingCard({ ranking: { category, entries }, visibleCount = 5 }: RankingCardProps) {
  const subtitle = category.lowerIsBetter ? (
    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-rpb-bordeaux">
      <InfoIcon size={14} className="shrink-0" />
      {category.subtitle}
    </p>
  ) : (
    <CardSubtitle>{category.subtitle}</CardSubtitle>
  );

  return (
    <Card
      title={category.label}
      titleLevel={3}
      titleStyle="ranking"
      subtitle={subtitle}
      interactive
      animation="on-scroll"
      tight
    >
      {entries.length === 0 ? (
        <p className="text-sm text-rpb-ink/72">Pas encore de données</p>
      ) : (
        <div className="flex flex-col">
          <ol className="m-0 flex list-none flex-col p-0">
            {entries.slice(0, visibleCount).map((entry, index) => (
              <RankingRow
                key={entry.player.licence}
                entry={entry}
                category={category}
                shared={isSharedRank(entries, index)}
                index={index}
              />
            ))}
          </ol>
          {entries.length > visibleCount && (
            <Disclosure summary="Voir le classement complet" size="sm">
              <ol className="m-0 flex list-none flex-col p-0">
                {entries.slice(visibleCount).map((entry) => (
                  <RankingCompactRow key={entry.player.licence} entry={entry} category={category} />
                ))}
              </ol>
            </Disclosure>
          )}
        </div>
      )}
    </Card>
  );
}
