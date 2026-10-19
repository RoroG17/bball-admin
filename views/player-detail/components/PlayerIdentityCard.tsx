import { useId } from "react";
import { Disclosure } from "@/components/ui/Disclosure";
import { LockIcon } from "@/components/ui/icons/LockIcon";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { animationDelay } from "@/lib/animationDelay";
import { formatDate } from "@/lib/format";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { PlayerProfile } from "@/models/PlayerProfile";

type PlayerIdentityCardProps = {
  profile: PlayerProfile;
  /** Libellés complets des saisons visibles, de la plus récente à la plus ancienne. */
  seasonLabels: string[];
};

const TERM = "text-[11px]/4 font-semibold tracking-[.08em] uppercase";

export function PlayerIdentityCard({ profile, seasonLabels }: PlayerIdentityCardProps) {
  const headingId = useId();
  const { player, team, personalInfo } = profile;
  const seasonList = (
    <ul className="flex flex-col gap-0.5 text-sm font-medium">
      {seasonLabels.map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );

  return (
    <section
      aria-labelledby={headingId}
      className="reveal flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-5 shadow-card"
      style={animationDelay(60)}
    >
      <div className="flex items-center gap-4">
        <span className="shrink-0 rounded-full border-[3px] border-rpb-bordeaux p-0.5">
          <PlayerAvatar player={player} size="2xl" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">Fiche joueur</p>
          <h1 id={headingId} className="font-display text-[32px] leading-[1.05] font-black wrap-anywhere">
            {formatPlayerName(player)}
          </h1>
        </div>
      </div>
      <dl className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <dt className={`${TERM} text-rpb-ink/72`}>Équipe actuelle</dt>
          <dd className="flex items-center gap-2 text-[15px]/[22px] font-semibold">
            <TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb context="inline" decorative />
            {team.name}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className={`${TERM} text-rpb-ink/72`}>Saisons</dt>
          <dd>
            {seasonLabels.length === 0 ? (
              <p className="text-sm text-rpb-ink/72">Aucune saison enregistrée</p>
            ) : seasonLabels.length <= 2 ? (
              seasonList
            ) : (
              <Disclosure summary={`${seasonLabels.length} saisons`} size="sm">
                {seasonList}
              </Disclosure>
            )}
          </dd>
        </div>
      </dl>
      {personalInfo && (
        <div className="flex flex-col gap-1.5 rounded-md bg-rpb-gold-light px-3.5 py-3">
          <p className={`flex items-center gap-1.5 ${TERM}`}>
            <LockIcon size={14} strokeWidth={2.2} />
            Infos personnelles
          </p>
          <p className="text-sm font-medium">
            Civilité : {personalInfo.civility}
            <br />
            Né(e) le {formatDate(personalInfo.birthDate)}
          </p>
          <p className="text-xs text-rpb-ink/72">Visible uniquement par le joueur et les admins.</p>
        </div>
      )}
    </section>
  );
}
