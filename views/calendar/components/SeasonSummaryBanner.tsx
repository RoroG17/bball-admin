import { useId } from "react";
import { animationDelay } from "@/lib/animationDelay";
import { formatDecimal, formatSignedDecimal, pluralize } from "@/lib/format";
import type { SeasonSummary } from "@/models/SeasonSummary";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { SummaryTile } from "@/views/calendar/components/SummaryTile";

type SeasonSummaryBannerProps = {
  title: string;
  summary: SeasonSummary;
};

function formatAverage(value: number | null): string {
  return value === null ? "—" : formatDecimal(value, 1);
}

function describeRecord({ wins, losses, draws }: SeasonSummary): string {
  const parts = [pluralize(wins, "victoire", "victoires"), pluralize(losses, "défaite", "défaites")];
  if (draws > 0) parts.push(pluralize(draws, "nul", "nuls"));
  return parts.join(", ");
}

function getNotices({ unresolved, scoreMissing }: SeasonSummary): string[] {
  const notices: string[] = [];
  if (unresolved > 0) {
    const games = pluralize(unresolved, "match joué non comptabilisé", "matchs joués non comptabilisés");
    notices.push(`${games} : l'équipe RPB n'a pas été reconnue.`);
  }
  if (scoreMissing > 0) {
    const games = pluralize(scoreMissing, "match passé", "matchs passés");
    notices.push(`${games} sans score saisi, ${scoreMissing > 1 ? "non comptés" : "non compté"} dans le bilan.`);
  }
  return notices;
}

/** Bandeau sombre du bilan : 6 tuiles (la tuile « Bilan » en premier, double largeur) et les mentions. */
export function SeasonSummaryBanner({ title, summary }: SeasonSummaryBannerProps) {
  const titleId = useId();
  const notices = getNotices(summary);
  const tiles = [
    {
      label: "Bilan",
      value: `${summary.wins} V – ${summary.losses} D`,
      detail: summary.draws > 0 ? pluralize(summary.draws, "match nul", "matchs nuls") : undefined,
      srLabel: describeRecord(summary),
      wide: true,
    },
    { label: "Matchs joués", value: formatDecimal(summary.played, 0) },
    {
      label: "Points marqués",
      value: formatDecimal(summary.pointsFor, 0),
      detail: `Moy. ${formatAverage(summary.averageFor)}`,
    },
    {
      label: "Points encaissés",
      value: formatDecimal(summary.pointsAgainst, 0),
      detail: `Moy. ${formatAverage(summary.averageAgainst)}`,
    },
    {
      label: "Différentiel",
      value: formatSignedDecimal(summary.pointDifferential, 0),
      detail: `${summary.averageDifferential === null ? "—" : formatSignedDecimal(summary.averageDifferential)} par match`,
    },
    { label: "Matchs restants", value: formatDecimal(summary.remaining, 0) },
  ];

  return (
    <section
      aria-labelledby={titleId}
      className="reveal flex flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-bordeaux-dark p-5 text-rpb-cream"
      style={animationDelay(80)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={titleId} className="font-display text-[22px] font-black">
          {title}
        </h2>
        <p className="text-[13px] text-rpb-gold-light tabular-nums">
          {pluralize(summary.scheduled, "match", "matchs")} au programme
        </p>
      </div>
      <dl className="flex flex-wrap gap-3">
        {tiles.map((tile, index) => (
          <SummaryTile key={tile.label} {...tile} delayMs={140 + index * 50} />
        ))}
      </dl>
      {notices.length > 0 && (
        <div className="reveal flex flex-col gap-2" style={animationDelay(460)}>
          {notices.map((message) => (
            <SummaryNotice key={message} tone="dark" message={message} />
          ))}
        </div>
      )}
    </section>
  );
}
