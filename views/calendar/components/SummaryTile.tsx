import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";

type SummaryTileProps = {
  label: string;
  value: string;
  detail?: string;
  /** Texte lu à la place de la valeur visuelle (ex. « 10 victoires, 4 défaites »). */
  srLabel?: string;
  /** Tuile deux fois plus large (tuile « Bilan »). */
  wide?: boolean;
  delayMs: number;
};

/** Tuile chiffrée du bandeau « Bilan de la saison » (`dt` + `dd` dans un `<dl>`). */
export function SummaryTile({ label, value, detail, srLabel, wide = false, delayMs }: SummaryTileProps) {
  return (
    <div
      className={cx(
        "reveal flex min-w-0 flex-col gap-1.5 rounded-lg bg-rpb-bordeaux px-3.5 py-3",
        wide ? "flex-[2_1_200px]" : "flex-[1_1_130px]",
      )}
      style={animationDelay(delayMs)}
    >
      <dt className="text-[11px]/4 font-semibold tracking-[.08em] text-rpb-gold-light uppercase">{label}</dt>
      <dd className="flex flex-col gap-1.5">
        <span
          aria-hidden={srLabel ? true : undefined}
          className="font-display text-[26px] leading-none font-black text-rpb-gold tabular-nums"
        >
          {value}
        </span>
        {srLabel && <span className="sr-only">{srLabel}</span>}
        {detail && <span className="text-[13px]/[18px] text-rpb-gold-light tabular-nums">{detail}</span>}
      </dd>
    </div>
  );
}
