import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { animationDelay } from "@/lib/animationDelay";
import type { RawSearchParams } from "@/models/AdminListQuery";
import { buildAdminHref } from "@/models/buildAdminHref";
import { describeAdminNotice } from "@/models/describeAdminNotice";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { parseAdminListQuery } from "@/models/parseAdminListQuery";
import { parseAdminNotice } from "@/models/parseAdminNotice";
import { parseSeasonId } from "@/models/parseSeasonId";
import { PARTICIPANT_SEARCH_SPEC } from "@/models/seasonListSpec";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import { getSeasonById } from "@/repositories/SeasonRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { ParticipantsFeedback } from "@/views/admin-season/components/ParticipantsFeedback";
import { SeasonFormBlock } from "@/views/admin-season/components/SeasonFormBlock";
import { SeasonParticipantsBlock } from "@/views/admin-season/components/SeasonParticipantsBlock";

type AdminSeasonEditViewProps = { rawId: string; rawQuery: RawSearchParams };

/**
 * Modification d'une saison : formulaire, puis section « Participants » enregistrée immédiatement (D-S1). Saison
 * introuvable → « Saison introuvable » ; lecture en échec → page d'erreur : JAMAIS de formulaire vide (P10).
 */
export async function AdminSeasonEditView({ rawId, rawQuery }: AdminSeasonEditViewProps) {
  const session = await requireAdmin();
  const seasonId = parseSeasonId(rawId) ?? notFound();
  const season = (await getSeasonById(seasonId, session.token)) ?? notFound();

  const label = formatSeasonLabel(season);
  const { q } = parseAdminListQuery(rawQuery, PARTICIPANT_SEARCH_SPEC);
  const editHref = buildAdminHref("season", { kind: "edit", id: seasonId });
  const cleanHref = q === "" ? editHref : `${editHref}?${new URLSearchParams({ q }).toString()}`;
  const notice = parseAdminNotice(rawQuery);

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Modifier la saison"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Saisons", href: buildAdminHref("season") },
          { label: "Modifier" },
        ]}
        actions={
          <AdminRowAction
            href={buildAdminHref("season", { kind: "delete", id: seasonId })}
            label="Supprimer"
            subject={label}
            tone="danger"
            icon={<TrashIcon size={16} strokeWidth={2.4} />}
          />
        }
      />
      {notice?.code === "created" && (
        <AdminNotice message={describeAdminNotice("created", "season", label)} cleanHref={cleanHref} />
      )}
      {season.teamId === null && <SummaryNotice tone="light" icon="alert" message={SEASON_MESSAGES.noTeamWarning} />}
      <div className="reveal flex flex-col gap-7" style={animationDelay(80)}>
        <section aria-label="Informations de la saison" className="flex flex-wrap items-start gap-5">
          <BlockErrorBoundary title="Formulaire de la saison" className="w-full max-w-[720px]">
            <Suspense fallback={<SkeletonCard lines={5} className="w-full max-w-[720px]" />}>
              <SeasonFormBlock mode="edit" season={season} token={session.token} />
            </Suspense>
          </BlockErrorBoundary>
        </section>
        <section
          id="participants"
          aria-labelledby="participants-title"
          className="flex w-full max-w-[720px] scroll-mt-6 flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-5 shadow-card"
        >
          <h2 id="participants-title" className="font-display text-xl leading-tight font-extrabold">
            Participants
          </h2>
          <SummaryNotice tone="light" message={SEASON_MESSAGES.participantsAutosave} />
          <ParticipantsFeedback>
            <BlockErrorBoundary title="Participants">
              <Suspense key={q} fallback={<SkeletonCard lines={5} />}>
                <SeasonParticipantsBlock seasonId={seasonId} token={session.token} query={q} />
              </Suspense>
            </BlockErrorBoundary>
          </ParticipantsFeedback>
        </section>
      </div>
    </main>
  );
}
