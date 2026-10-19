import { AdminNotice } from "@/components/admin/AdminNotice";
import type { AdminNotice as AdminNoticeData } from "@/models/AdminNotice";
import { describeAdminNotice } from "@/models/describeAdminNotice";
import { readOrNull } from "@/repositories/support/readOrNull";
import { listTeams } from "@/repositories/TeamRepository";

type TeamNoticeBlockProps = {
  notice: AdminNoticeData;
  cleanHref: string;
  token: string;
};

/**
 * Message de résultat après une écriture. Le nom de l'équipe est retrouvé par `ref` dans la liste (jamais lu dans
 * l'URL) ; si la liste est illisible ou la référence inconnue, le message reste valable sans nom.
 */
export async function TeamNoticeBlock({ notice, cleanHref, token }: TeamNoticeBlockProps) {
  let label: string | null = null;
  if ((notice.code === "created" || notice.code === "updated") && notice.ref !== null) {
    const teams = await readOrNull(() => listTeams(token));
    label = teams?.find((team) => String(team.id) === notice.ref)?.name ?? null;
  }
  return <AdminNotice message={describeAdminNotice(notice.code, "team", label)} cleanHref={cleanHref} />;
}
