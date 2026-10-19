import { GameOutcomeBadge } from "@/components/ui/GameOutcomeBadge";
import type { CalendarGame } from "@/models/CalendarGame";

type GameStatusBadgeProps = {
  entry: CalendarGame;
  /** Délai de l'animation `pop` (ms), transmis à `GameOutcomeBadge`. Sans valeur, pas d'animation. */
  popDelayMs?: number;
};

/** Résultat ou « Score à saisir », toujours en texte. Rien pour un match à venir ni pour un côté RPB inconnu. */
export function GameStatusBadge({ entry, popDelayMs }: GameStatusBadgeProps) {
  if (entry.status === "scoreMissing") return <GameOutcomeBadge outcome="notEntered" popDelayMs={popDelayMs} />;
  if (entry.status === "played") return <GameOutcomeBadge outcome={entry.outcome} popDelayMs={popDelayMs} />;
  return null;
}
