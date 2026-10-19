import { deleteSeason } from "@/actions/seasonActions";
import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { DeletionImpactList } from "@/components/admin/DeletionImpactList";
import { buildAdminHref } from "@/models/buildAdminHref";
import { computeSeasonDeletionImpact } from "@/models/computeSeasonDeletionImpact";
import { getSeasonDeletionFacts } from "@/repositories/SeasonImpactRepository";

type SeasonDeletionBlockProps = {
  seasonId: number;
  token: string;
};

/**
 * Impact chiffré puis bouton de suppression. Matchs et inscriptions sont indispensables : si l'une des deux lectures
 * échoue le bloc lève, le `BlockErrorBoundary` affiche « Réessayer » et le bouton n'est jamais rendu. Les lignes de
 * statistiques sont au mieux : un match illisible donne « un nombre indéterminé » et n'interdit pas la suppression (D-A7).
 */
export async function SeasonDeletionBlock({ seasonId, token }: SeasonDeletionBlockProps) {
  const impact = computeSeasonDeletionImpact(await getSeasonDeletionFacts(seasonId, token));

  return (
    <>
      <DeletionImpactList impact={impact} />
      <AdminConfirmForm
        action={deleteSeason}
        fields={{ id: String(seasonId) }}
        confirmLabel="Supprimer définitivement"
        busyLabel="Suppression…"
        cancelHref={buildAdminHref("season")}
      />
    </>
  );
}
