import { Card } from "@/components/ui/Card";
import { CardSubtitle } from "@/components/ui/CardSubtitle";
import type { GameLogEntry } from "@/models/GameLogEntry";
import { GameLogTable } from "@/views/player-detail/components/GameLogTable";

type GameLogSectionProps = {
  log: GameLogEntry[];
  periods: number[];
  selectionLabel: string;
};

export function GameLogSection({ log, periods, selectionLabel }: GameLogSectionProps) {
  return (
    <Card
      title="Match par match"
      subtitle={<CardSubtitle>{selectionLabel}</CardSubtitle>}
      animation="reveal"
      delayMs={420}
    >
      <GameLogTable log={log} periods={periods} selectionLabel={selectionLabel} />
    </Card>
  );
}
