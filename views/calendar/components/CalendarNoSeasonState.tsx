import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";

export function CalendarNoSeasonState() {
  return (
    <Card title="Calendrier" animation="reveal">
      <EmptyState
        icon={<CalendarIcon size={40} strokeWidth={1.6} />}
        title="Tu n'es inscrit à aucune saison."
        text="Contacte un administrateur du club si tu penses que c'est une erreur."
      />
    </Card>
  );
}
