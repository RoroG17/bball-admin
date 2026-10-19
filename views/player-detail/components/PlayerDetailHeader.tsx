import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { PlayerAdminActions } from "@/views/player-detail/components/PlayerAdminActions";

type PlayerDetailHeaderProps = {
  licence: string;
  /** Saison à retrouver sur la liste, ou `undefined`. */
  backSeasonParam: string | undefined;
  isAdmin: boolean;
};

export function PlayerDetailHeader({ licence, backSeasonParam, isAdmin }: PlayerDetailHeaderProps) {
  return (
    <div className="reveal flex flex-wrap items-center justify-between gap-3">
      <Link
        href={backSeasonParam ? `/player?saison=${backSeasonParam}` : "/player"}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md pr-2 text-[15px] font-semibold text-rpb-bordeaux no-underline focus-ring hover:underline hover:underline-offset-4"
      >
        <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
        Retour à l&apos;effectif
      </Link>
      {isAdmin && <PlayerAdminActions licence={licence} />}
    </div>
  );
}
