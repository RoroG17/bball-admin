import { deleteGame } from "@/actions/gameActions";
import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { DeletionImpactList } from "@/components/admin/DeletionImpactList";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { computeGameDeletionImpact } from "@/models/computeGameDeletionImpact";
import { countGameStatLines } from "@/repositories/GameStatsRepository";

type GameDeletionBlockProps = { gameId: number; seasonId: number };

/**
 * Impact chiffré puis bouton de suppression. La lecture elle-même est indispensable (si elle lève, le boundary affiche
 * « Réessayer » et le bouton n'est jamais rendu) ; un contenu de statistiques illisible donne « nombre indéterminé » et
 * n'interdit rien (D-A7). Un match avec statistiques n'est jamais bloqué (D-ADM-1).
 */
export async function GameDeletionBlock({ gameId, seasonId }: GameDeletionBlockProps) {
  const impact = computeGameDeletionImpact(await countGameStatLines(gameId));
  return (
    <>
      <DeletionImpactList impact={impact} />
      <AdminConfirmForm
        action={deleteGame}
        fields={{ gameId: String(gameId), seasonId: String(seasonId) }}
        confirmLabel="Supprimer définitivement"
        busyLabel="Suppression…"
        cancelHref={buildAdminGameListHref(seasonId)}
      />
    </>
  );
}
