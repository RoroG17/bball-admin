import { notFound } from "next/navigation";
import { HalfCourt } from "@/components/ui/HalfCourt";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import { getPlayerProfile } from "@/repositories/PlayerRepository";
import { requirePermission } from "@/repositories/SessionRepository";
import { ExamCreateForm } from "@/views/exam-create/components/ExamCreateForm";
import { PLAYER_DETAIL_MAIN_CLASSES } from "@/views/player-detail/components/playerDetailLayout";
import Link from "next/link";

type ExamCreateViewProps = {
  /** Segment `[licence]` brut, non validé. */
  rawLicence: string;
};

export async function ExamCreateView({ rawLicence }: ExamCreateViewProps) {
  const licence = parsePlayerLicence(rawLicence);
  if (licence === null) notFound();

  // Création réservée aux admins : « Accès refusé » avant tout appel de données.
  await requirePermission("managePlayerData");

  const profile = await getPlayerProfile(licence, { includePersonalInfo: false });
  if (!profile) notFound();

  const playerName = `${profile.player.firstName} ${profile.player.lastName}`;

  return (
    <main className={`anim ${PLAYER_DETAIL_MAIN_CLASSES}`}>
      <div className="reveal flex flex-col gap-3">
        <Link
          href={buildPlayerHref(licence, { onglet: "exams" })}
          className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md pr-2 text-[15px] font-semibold text-rpb-bordeaux no-underline focus-ring hover:underline hover:underline-offset-4"
        >
          <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
          Retour à la fiche
        </Link>
        <h1 className="font-display text-[28px] leading-[1.1] font-black">Créer un examen de tir</h1>
        <p className="text-[15px]/[22px] text-rpb-ink/72">{playerName}</p>
      </div>
      <ExamCreateForm licence={licence} today={getParisIsoDate(new Date())} court={<HalfCourt />} />
    </main>
  );
}
