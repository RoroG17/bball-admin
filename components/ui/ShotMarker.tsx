import { toCourtPoint } from "@/lib/halfCourtGeometry";
import { animationDelay } from "@/lib/animationDelay";
import type { Shot } from "@/models/Shot";

type ShotMarkerProps = {
  shot: Pick<Shot, "made" | "position">;
  /** Rang d'affichage, pour la cascade d'apparition. */
  index: number;
};

/** Réussi = cercle plein, manqué = croix : la forme porte le sens. Le résumé est dans le `<title>` du SVG. */
export function ShotMarker({ shot, index }: ShotMarkerProps) {
  const { cx, cy } = toCourtPoint(shot.position);

  return (
    <g transform={`translate(${cx} ${cy})`} aria-hidden="true">
      {/* Deux groupes : l'animation `pop` écraserait l'attribut `transform`. */}
      <g className="pop origin-center [transform-box:fill-box]" style={animationDelay(300 + Math.min(index, 40) * 12)}>
        {shot.made ? (
          <circle r={12} className="fill-success stroke-rpb-ink" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        ) : (
          <path
            d="M-9 -9L9 9M9 -9L-9 9"
            className="fill-none stroke-danger"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </g>
    </g>
  );
}
