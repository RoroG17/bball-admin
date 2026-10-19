import { Card } from "@/components/ui/Card";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import type { DuplicatePlayer } from "@/models/DuplicatePlayer";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import { PlayerStatsTable } from "@/views/game-detail/components/PlayerStatsTable";

type PlayerStatsSectionProps = {
  lines: PlayerGameStats[];
  periods: number[];
  duplicates: DuplicatePlayer[];
  currentLicence: string | null;
};

export function PlayerStatsSection({ lines, periods, duplicates, currentLicence }: PlayerStatsSectionProps) {
  return (
    <Card title="Feuille de stats" animation="reveal" delayMs={300}>
      <PlayerStatsTable
        lines={lines}
        periods={periods}
        duplicateLicences={duplicates.map((duplicate) => duplicate.licence)}
        currentLicence={currentLicence}
      />
      {duplicates.length > 0 && (
        <SummaryNotice
          tone="light"
          message="Certains joueurs apparaissent plusieurs fois (lignes marquées « Doublon ») : les totaux comptent toutes les lignes."
        />
      )}
    </Card>
  );
}
