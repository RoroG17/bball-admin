import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { ParticipantIntent } from "@/models/ParticipantAction";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import { ParticipantActionButton } from "@/views/admin-season/components/ParticipantActionButton";

type SeasonParticipantRowProps = {
  entry: PlayerListEntry;
  seasonId: number;
  /** `remove` : joueur inscrit (« Retirer ») ; `add` : candidat (« Inscrire »). */
  intent: ParticipantIntent;
};

/** Ligne d'un joueur : identité, équipe actuelle, licence, et le bouton d'ajout ou de retrait (≥ 44 px). */
export function SeasonParticipantRow({ entry, seasonId, intent }: SeasonParticipantRowProps) {
  const name = formatPlayerName(entry.player);
  const accessibleLabel = intent === "add" ? `Inscrire ${name} à la saison` : `Retirer ${name} de la saison`;

  return (
    <li className="flex items-center gap-3 border-b border-rpb-ink/12 py-2.5 last:border-b-0">
      <PlayerAvatar player={entry.player} size="md" decorative />
      <div className="flex min-w-0 flex-[1_1_auto] flex-col">
        <span className="text-[15px]/[22px] font-bold wrap-anywhere">{name}</span>
        <span className="text-[13px]/5 text-rpb-ink/72 wrap-anywhere">
          {entry.team.name} · {entry.player.licence}
        </span>
      </div>
      <ParticipantActionButton
        intent={intent}
        seasonId={seasonId}
        licence={entry.player.licence}
        playerName={name}
        label={intent === "add" ? "Inscrire" : "Retirer"}
        accessibleLabel={accessibleLabel}
      />
    </li>
  );
}
