import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";

export function NoSeasonState() {
  return (
    <Card title="Tableau de bord" animation="reveal">
      <EmptyState
        icon={<CalendarIcon size={40} strokeWidth={1.6} />}
        title="Aucune saison disponible pour ton compte."
        text="Contacte un administrateur du club si tu penses que c'est une erreur."
      />
    </Card>
  );
}
