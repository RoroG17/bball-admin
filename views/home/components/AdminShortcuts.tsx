import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { animationDelay } from "@/lib/animationDelay";
import { formatGameDateShort } from "@/lib/format";
import { getPreviousAndNextGames } from "@/repositories/GameRepository";

type AdminShortcutsProps = { seasonId: number };

/** Raccourci admin vers la saisie des stats du prochain match. Rien s'il n'y a pas de match à venir. */
export async function AdminShortcuts({ seasonId }: AdminShortcutsProps) {
  const { next } = await getPreviousAndNextGames(seasonId);
  if (!next) return null;

  return (
    <section
      aria-label="Raccourcis"
      className="reveal flex flex-wrap items-center justify-between gap-3 rounded-lg bg-rpb-bordeaux-dark px-[18px] py-3.5 text-rpb-cream"
      style={animationDelay(80)}
    >
      <p className="flex items-center gap-2.5 text-[15px]">
        <CalendarIcon size={22} className="shrink-0 text-rpb-gold" />
        <span>
          Prochain match :{" "}
          <strong>
            {next.home.name} – {next.away.name}
          </strong>
          , {formatGameDateShort(next.date)}
        </span>
      </p>
      <PrimaryButton variant="gold" href={`/game/${next.id}/stat`}>
        Saisir les stats du match
        <ArrowRightIcon size={18} className="btn-arrow" />
      </PrimaryButton>
    </section>
  );
}
