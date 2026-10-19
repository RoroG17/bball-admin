import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updatePlayer } from "@/actions/adminPlayerActions";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { animationDelay } from "@/lib/animationDelay";
import { buildMediaBaseUrl } from "@/lib/mediaUrl";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { buildAdminHref } from "@/models/buildAdminHref";
import { formatPlayerName } from "@/models/formatPlayerName";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { parseCivility } from "@/models/parseCivility";
import { parsePlayerLicence } from "@/models/parsePlayerLicence";
import type { PlayerField } from "@/models/PlayerInput";
import { toPlayerFormValues } from "@/models/toPlayerFormValues";
import { toTeamSelectOptions } from "@/models/toTeamSelectOptions";
import { getAdminPlayer } from "@/repositories/AdminPlayerRepository";
import { requireAdmin } from "@/repositories/SessionRepository";
import { listTeams } from "@/repositories/TeamRepository";
import { AdminPlayerFormFields } from "@/views/admin-player/components/AdminPlayerFormFields";
import { PlayerAccountWarningBlock } from "@/views/admin-player/components/PlayerAccountWarningBlock";

type AdminPlayerEditViewProps = { rawLicence: string };

/**
 * Formulaire de modification pré-rempli côté serveur. Licence invalide ou inconnue → « Joueur introuvable » ; lecture en
 * échec → page d'erreur : JAMAIS de formulaire vide (P9).
 */
export async function AdminPlayerEditView({ rawLicence }: AdminPlayerEditViewProps) {
  const session = await requireAdmin();
  const licence = parsePlayerLicence(rawLicence) ?? notFound();
  const [player, teams] = await Promise.all([getAdminPlayer(licence), listTeams(session.token)]);
  if (!player) notFound();

  const rawCivility = player.personalInfo.civility;

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Modifier le joueur"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "Joueurs", href: buildAdminHref("player") },
          { label: "Modifier" },
        ]}
        actions={
          <AdminRowAction
            href={buildAdminHref("player", { kind: "delete", id: licence })}
            label="Supprimer"
            subject={formatPlayerName(player.player)}
            tone="danger"
            icon={<TrashIcon size={16} strokeWidth={2.4} />}
          />
        }
      />
      <div className="reveal flex flex-wrap items-start gap-5" style={animationDelay(80)}>
        <AdminForm<PlayerField>
          action={updatePlayer}
          submitLabel="Enregistrer"
          busyLabel="Enregistrement…"
          cancelHref={buildAdminHref("player")}
        >
          <BlockErrorBoundary title="Compte de connexion">
            <Suspense fallback={<SkeletonCard lines={3} />}>
              <PlayerAccountWarningBlock licence={licence} token={session.token} />
            </Suspense>
          </BlockErrorBoundary>
          <AdminPlayerFormFields
            mode="edit"
            defaults={toPlayerFormValues(player)}
            teamOptions={toTeamSelectOptions(teams)}
            photoBaseUrl={buildMediaBaseUrl("joueur")}
            today={getParisIsoDate(new Date())}
            civilityHint={
              parseCivility(rawCivility) === null ? ADMIN_PLAYER_MESSAGES.civilityUnknown(rawCivility) : undefined
            }
          />
        </AdminForm>
      </div>
    </main>
  );
}
