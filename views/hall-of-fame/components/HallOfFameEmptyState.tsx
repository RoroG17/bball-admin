import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PodiumIcon } from "@/components/ui/icons/PodiumIcon";

/** Base sans aucun record : message unique, pas d'onglets. */
export function HallOfFameEmptyState() {
  return (
    <Card title="Records du club" titleLevel={2} animation="reveal" delayMs={80}>
      <EmptyState
        icon={<PodiumIcon size={40} strokeWidth={1.6} />}
        title="Aucun record pour l'instant"
        text="Les records apparaîtront après la première saisie de statistiques."
      />
    </Card>
  );
}
