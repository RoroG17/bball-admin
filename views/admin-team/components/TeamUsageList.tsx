import { Card } from "@/components/ui/Card";
import { pluralize } from "@/lib/format";
import { describeTeamClubRole } from "@/models/describeTeamClubRole";
import type { TeamUsage } from "@/models/TeamUsage";

type TeamUsageListProps = { usage: TeamUsage };

const EYEBROW = "text-[11px]/4 font-semibold tracking-[.08em] text-rpb-ink/72 uppercase";
const TILE = "flex flex-col gap-0.5 rounded-lg border-2 border-rpb-ink/14 px-3 py-2.5";

/** Usage de l'équipe, pour mesurer l'effet d'un renommage. Un nombre inconnu s'écrit « Indéterminé », jamais 0. */
export function TeamUsageList({ usage }: TeamUsageListProps) {
  const clubRole = describeTeamClubRole(usage.clubSeasons);

  return (
    <Card title="Utilisation de cette équipe" animation="reveal" delayMs={80} className="max-w-[420px] flex-[1_1_280px]">
      <dl className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <dt className={EYEBROW}>Équipe du club</dt>
          <dd className="text-[15px]/[22px] font-semibold">{clubRole ?? "Non, aucune saison ne l'utilise"}</dd>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-3">
          <div className={TILE}>
            <dt className={EYEBROW}>Joueurs rattachés</dt>
            <dd className="font-display text-[28px] leading-[1.1] font-black tabular-nums">
              {usage.playerCount}
              <span className="sr-only"> {pluralize(usage.playerCount, "joueur", "joueurs").replace(/^\d+ /, "")}</span>
            </dd>
          </div>
          <div className={TILE}>
            <dt className={EYEBROW}>Matchs</dt>
            {usage.gameCount === null ? (
              <dd className="flex flex-col gap-0.5">
                <span className="text-lg font-bold">Indéterminé</span>
                <span className="text-[13px]/5 text-rpb-ink/72">Plusieurs équipes portent ce nom.</span>
              </dd>
            ) : (
              <dd className="font-display text-[28px] leading-[1.1] font-black tabular-nums">{usage.gameCount}</dd>
            )}
          </div>
        </div>
      </dl>
    </Card>
  );
}
