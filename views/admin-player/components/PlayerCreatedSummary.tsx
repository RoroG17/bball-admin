import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { AdminPlayer } from "@/models/AdminPlayer";
import { formatPlayerName } from "@/models/formatPlayerName";

type PlayerCreatedSummaryProps = { player: AdminPlayer };

/** Récapitulatif du joueur créé : photo (ou initiales), nom, licence et équipe. */
export function PlayerCreatedSummary({ player }: PlayerCreatedSummaryProps) {
  return (
    <section
      aria-label="Joueur créé"
      className="reveal flex flex-wrap items-center gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-5 shadow-card"
    >
      <PlayerAvatar player={player.player} size="xl" decorative />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-display text-xl leading-tight font-extrabold wrap-anywhere">{formatPlayerName(player.player)}</p>
        <p className="text-sm text-rpb-ink/72 tabular-nums">{`Licence ${player.player.licence}`}</p>
        <p className="flex items-center gap-2 text-sm font-medium">
          <TeamLogo name={player.team.name} logoUrl={player.team.logoUrl} isRpb={false} context="inline" decorative />
          {player.team.name}
        </p>
      </div>
    </section>
  );
}
