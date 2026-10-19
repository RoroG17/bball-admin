import { deletePlayer } from "@/actions/adminPlayerActions";
import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { DeletionImpactList } from "@/components/admin/DeletionImpactList";
import { buildAdminHref } from "@/models/buildAdminHref";
import { computePlayerDeletionImpact } from "@/models/computePlayerDeletionImpact";
import { getPlayerDeletionFigures } from "@/repositories/AdminPlayerRepository";

type PlayerDeletionBlockProps = {
  licence: string;
  token: string;
};

/**
 * Impact chiffré puis bouton de suppression. Les cinq lectures sont indépendantes : une lecture en échec donne « un
 * nombre indéterminé » pour sa seule ligne (jamais 0) et n'interdit pas la suppression (D-A7).
 */
export async function PlayerDeletionBlock({ licence, token }: PlayerDeletionBlockProps) {
  const impact = computePlayerDeletionImpact(await getPlayerDeletionFigures(licence, token));

  return (
    <>
      <DeletionImpactList impact={impact} />
      <AdminConfirmForm
        action={deletePlayer}
        fields={{ licence }}
        confirmLabel="Supprimer définitivement"
        busyLabel="Suppression…"
        cancelHref={buildAdminHref("player")}
      />
    </>
  );
}
