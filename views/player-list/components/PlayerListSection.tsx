import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupIcon } from "@/components/ui/icons/GroupIcon";
import { pluralize } from "@/lib/format";
import type { PlayerListScope } from "@/models/PlayerListScope";
import { listAllPlayers, listSeasonPlayers } from "@/repositories/PlayerRepository";
import { PlayerSearchList } from "@/views/player-list/components/PlayerSearchList";

type PlayerListSectionProps = { scope: PlayerListScope };

export async function PlayerListSection({ scope }: PlayerListSectionProps) {
  const entries = scope.kind === "all" ? await listAllPlayers() : await listSeasonPlayers(scope.season.id);

  if (entries.length === 0) {
    return (
      <Card title="Effectif" animation="reveal" delayMs={80}>
        <EmptyState
          icon={<GroupIcon size={40} strokeWidth={1.6} />}
          title={scope.kind === "all" ? "Aucun joueur enregistré" : "Aucun joueur inscrit sur cette saison"}
        />
      </Card>
    );
  }

  return (
    <Card
      title="Effectif"
      animation="reveal"
      delayMs={80}
      aside={
        <span className="text-[13px] whitespace-nowrap text-rpb-ink/72 tabular-nums">
          {pluralize(entries.length, "joueur", "joueurs")}
        </span>
      }
    >
      <PlayerSearchList entries={entries} seasonParam={scope.kind === "season" ? String(scope.season.id) : null} />
    </Card>
  );
}
