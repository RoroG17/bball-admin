import { AdminNotice } from "@/components/admin/AdminNotice";
import type { AdminNotice as AdminNoticeData } from "@/models/AdminNotice";
import { describeAdminNotice } from "@/models/describeAdminNotice";
import { formatGameHeading } from "@/models/formatGameHeading";
import { listSeasonGames } from "@/repositories/GameRepository";
import { readOrNull } from "@/repositories/support/readOrNull";

type AdminGameNoticeProps = { notice: AdminNoticeData; seasonId: number; cleanHref: string };

/**
 * Message de résultat après une écriture. Le libellé du match est retrouvé par `ref` dans les matchs de la saison
 * (jamais lu dans l'URL) ; liste illisible ou référence inconnue : le message reste valable sans libellé.
 */
export async function AdminGameNotice({ notice, seasonId, cleanHref }: AdminGameNoticeProps) {
  let label: string | null = null;
  if ((notice.code === "created" || notice.code === "updated") && notice.ref !== null) {
    const games = await readOrNull(() => listSeasonGames(seasonId));
    const game = games?.find((candidate) => String(candidate.id) === notice.ref);
    label = game ? formatGameHeading(game) : null;
  }
  return <AdminNotice message={describeAdminNotice(notice.code, "game", label)} cleanHref={cleanHref} />;
}
