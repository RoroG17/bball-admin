import type { ShotZone } from "@/models/ShotZone";

type ExamZoneMarkerProps = {
  zone: ShotZone;
  size: number;
  className?: string;
};

/** Forme propre à chaque zone (rond, carré, triangle) : la zone n'est jamais portée par la couleur seule (DS55). */
export function ExamZoneMarker({ zone, size, className }: ExamZoneMarkerProps) {
  return (
    <svg width={size} height={size} viewBox="-8 -8 16 16" aria-hidden="true" className={className}>
      {zone === "paint" && <circle r={6} className="fill-rpb-bordeaux stroke-rpb-cream" strokeWidth={1.5} />}
      {zone === "midRange" && <rect x={-5.5} y={-5.5} width={11} height={11} className="fill-rpb-ink stroke-rpb-cream" strokeWidth={1.5} />}
      {zone === "threePoint" && (
        <path d="M0 -7L7 6H-7Z" className="fill-rpb-red stroke-rpb-cream" strokeWidth={1.5} strokeLinejoin="round" />
      )}
    </svg>
  );
}
