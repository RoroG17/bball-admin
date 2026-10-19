import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupIcon } from "@/components/ui/icons/GroupIcon";
import { listSeasonRoster } from "@/repositories/PlayerRepository";
import { RosterRow } from "@/views/home/components/RosterRow";

type RosterCardProps = {
  seasonId: number;
  className?: string;
};

const VISIBLE_COUNT = 8;

export async function RosterCard({ seasonId, className }: RosterCardProps) {
  const roster = await listSeasonRoster(seasonId);
  const visible = roster.slice(0, VISIBLE_COUNT);
  const hidden = roster.slice(VISIBLE_COUNT);

  return (
    <Card
      title="Effectif"
      animation="on-scroll"
      className={className}
      aside={
        roster.length > 0 && (
          <span className="text-[13px] text-rpb-ink/72 tabular-nums">
            {roster.length} {roster.length > 1 ? "joueurs" : "joueur"}
          </span>
        )
      }
    >
      {roster.length === 0 ? (
        <EmptyState icon={<GroupIcon size={40} />} title="Aucun joueur inscrit sur cette saison" />
      ) : (
        <div className="flex flex-col">
          <ul className="flex flex-col">
            {visible.map((player, index) => (
              <RosterRow key={player.licence} player={player} delayMs={index * 45} />
            ))}
          </ul>
          {hidden.length > 0 && (
            <Disclosure summary={`Voir tout l'effectif (${roster.length})`}>
              <ul className="flex flex-col">
                {hidden.map((player) => (
                  <RosterRow key={player.licence} player={player} showChevron={false} />
                ))}
              </ul>
            </Disclosure>
          )}
        </div>
      )}
    </Card>
  );
}
