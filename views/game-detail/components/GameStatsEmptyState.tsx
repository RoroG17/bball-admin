import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { ChartIcon } from "@/components/ui/icons/ChartIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ADMIN_GAME_ACTION_LABELS } from "@/models/AdminGameAction";

type GameStatsEmptyStateProps = { availability: "upcoming" | "notEntered"; isAdmin: boolean; gameId: number };

/** Le bloc reste affiché avec une explication au lieu de disparaître (P6). */
export function GameStatsEmptyState({ availability, isAdmin, gameId }: GameStatsEmptyStateProps) {
  return (
    <Card title="Statistiques du match" animation="reveal" delayMs={300}>
      {availability === "upcoming" ? (
        <EmptyState
          icon={<CalendarIcon size={40} strokeWidth={1.6} />}
          title="Les statistiques seront disponibles après le match."
        />
      ) : (
        <>
          <EmptyState
            icon={<ChartIcon size={40} strokeWidth={1.6} />}
            title="Statistiques non saisies"
            text="Les statistiques de ce match n'ont pas encore été saisies."
          />
          {isAdmin && (
            <div className="flex justify-center">
              <PrimaryButton href={`/game/${gameId}/stat`}>
                {ADMIN_GAME_ACTION_LABELS.enterStats}
                <ArrowRightIcon size={18} strokeWidth={2.5} className="btn-arrow shrink-0" />
              </PrimaryButton>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
