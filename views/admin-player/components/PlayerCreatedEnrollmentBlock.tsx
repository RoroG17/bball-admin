import Link from "next/link";
import { enrollPlayer } from "@/actions/adminPlayerActions";
import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { Card } from "@/components/ui/Card";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { buildAdminHref } from "@/models/buildAdminHref";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { resolvePlayerEnrollment } from "@/models/resolvePlayerEnrollment";
import { getPlayerEnrollment } from "@/repositories/AdminPlayerRepository";

type PlayerCreatedEnrollmentBlockProps = {
  licence: string;
  token: string;
};

/**
 * Inscription à la saison en cours (la plus récente, D-P2), par un bouton SÉPARÉ de la création : un joueur non inscrit
 * n'apparaît ni dans les effectifs ni dans la saisie des stats. Action idempotente. Lecture en échec → bloc en erreur.
 */
export async function PlayerCreatedEnrollmentBlock({ licence, token }: PlayerCreatedEnrollmentBlockProps) {
  const { seasons, enrolledSeasonIds } = await getPlayerEnrollment(licence, token);
  const enrollment = resolvePlayerEnrollment(seasons, enrolledSeasonIds);

  return (
    <Card title="Inscription à la saison">
      {enrollment.kind === "noSeason" && (
        <>
          <SummaryNotice tone="light" icon="alert" message={ADMIN_PLAYER_MESSAGES.noSeason} />
          <Link
            href={buildAdminHref("season", "create")}
            className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
          >
            Créer une saison
          </Link>
        </>
      )}
      {enrollment.kind === "enrolled" && (
        <SummaryNotice tone="light" icon="check" message={`Inscrit à la saison ${formatSeasonLabel(enrollment.season)}.`} />
      )}
      {enrollment.kind === "canEnroll" && (
        <>
          <p className="text-[15px]/[22px]">{ADMIN_PLAYER_MESSAGES.enrollmentExplain}</p>
          <AdminConfirmForm
            action={enrollPlayer}
            fields={{ licence, seasonId: String(enrollment.season.id) }}
            confirmLabel={`Inscrire à la saison ${formatSeasonLabel(enrollment.season)}`}
            busyLabel="Inscription…"
            cancelHref={buildAdminHref("player")}
            tone="neutral"
          />
        </>
      )}
    </Card>
  );
}
