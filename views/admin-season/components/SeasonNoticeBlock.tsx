import { AdminNotice } from "@/components/admin/AdminNotice";
import type { AdminNotice as AdminNoticeData } from "@/models/AdminNotice";
import { describeAdminNotice } from "@/models/describeAdminNotice";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { readOrNull } from "@/repositories/support/readOrNull";

type SeasonNoticeBlockProps = {
  notice: AdminNoticeData;
  cleanHref: string;
  token: string;
};

/**
 * Message de résultat après une écriture. Le libellé de la saison est retrouvé par `ref` dans la liste (jamais lu dans
 * l'URL) ; liste illisible ou référence inconnue : le message reste valable sans libellé.
 */
export async function SeasonNoticeBlock({ notice, cleanHref, token }: SeasonNoticeBlockProps) {
  let label: string | null = null;
  if ((notice.code === "created" || notice.code === "updated") && notice.ref !== null) {
    const seasons = await readOrNull(() => listAllSeasons(token));
    const season = seasons?.find((candidate) => String(candidate.id) === notice.ref);
    label = season ? formatSeasonLabel(season) : null;
  }
  return <AdminNotice message={describeAdminNotice(notice.code, "season", label)} cleanHref={cleanHref} />;
}
