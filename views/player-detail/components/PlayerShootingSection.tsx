import { Card } from "@/components/ui/Card";
import { CardSubtitle } from "@/components/ui/CardSubtitle";
import { ShootingTile } from "@/components/ui/ShootingTile";
import type { StatTotals } from "@/models/StatTotals";

type PlayerShootingSectionProps = {
  /** Totaux de la sélection, toutes périodes. */
  totals: StatTotals;
  selectionLabel: string;
};

export function PlayerShootingSection({ totals, selectionLabel }: PlayerShootingSectionProps) {
  const tiles = [
    { label: "Tirs à 2 pts", totals: totals.twoPoints },
    { label: "Tirs à 3 pts", totals: totals.threePoints },
    { label: "Lancers francs", totals: totals.freeThrows },
    { label: "Tous les tirs (2 + 3 pts)", totals: totals.fieldGoals },
  ];

  return (
    <Card
      title="Réussite aux tirs"
      subtitle={<CardSubtitle>{selectionLabel}</CardSubtitle>}
      animation="on-scroll"
      className="flex-[1_1_300px]"
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-3">
        {tiles.map((tile, index) => (
          <ShootingTile key={tile.label} label={tile.label} totals={tile.totals} index={index} />
        ))}
      </div>
    </Card>
  );
}
