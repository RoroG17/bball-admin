import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";

export function PlayerListNoSeasonState() {
  return (
    <Card title="Joueurs" animation="reveal">
      <EmptyState
        icon={<CalendarIcon size={40} strokeWidth={1.6} />}
        title="Aucune saison disponible"
        text="Tu n'es inscrit sur aucune saison pour le moment."
      />
    </Card>
  );
}
