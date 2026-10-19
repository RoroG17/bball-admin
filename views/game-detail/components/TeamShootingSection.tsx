import { Card } from "@/components/ui/Card";
import { computeTeamTotals } from "@/models/computeTeamTotals";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import { ShootingTile } from "@/components/ui/ShootingTile";

type TeamShootingSectionProps = { lines: PlayerGameStats[] };

/** Réussite de l'équipe sur ce match, en texte (P8). */
export function TeamShootingSection({ lines }: TeamShootingSectionProps) {
  const totals = computeTeamTotals(lines, "all");
  const tiles = [
    { label: "Tirs à 2 pts", totals: totals.twoPoints },
    { label: "Tirs à 3 pts", totals: totals.threePoints },
    { label: "Lancers francs", totals: totals.freeThrows },
    { label: "Tous les tirs (2 + 3 pts)", totals: totals.fieldGoals },
  ];

  return (
    <Card title="Réussite aux tirs de l'équipe" animation="on-scroll">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-3">
        {tiles.map((tile, index) => (
          <ShootingTile key={tile.label} label={tile.label} totals={tile.totals} index={index} />
        ))}
      </div>
    </Card>
  );
}
