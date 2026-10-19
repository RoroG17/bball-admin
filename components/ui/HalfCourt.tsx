import { BASKET, COURT_HEIGHT, COURT_WIDTH, PAINT } from "@/lib/halfCourtGeometry";

const LINE = { className: "fill-none stroke-rpb-ink", strokeWidth: 2, vectorEffect: "non-scaling-stroke" } as const;

/**
 * Lignes du demi-terrain, à rendre DANS un `<svg viewBox="0 0 750 530">`. Panier en haut.
 * Rendu côté serveur et passé en prop au composant client (aucun poids dans le bundle).
 */
export function HalfCourt() {
  return (
    <g aria-hidden="true">
      <rect width={COURT_WIDTH} height={COURT_HEIGHT} className="fill-rpb-gold-light" />
      <rect
        x={PAINT.x}
        y={PAINT.y}
        width={PAINT.width}
        height={PAINT.height}
        className="fill-rpb-cream stroke-rpb-ink"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <path d="M312.6 197.6A62.4 62.4 0 0 0 437.4 197.6" {...LINE} />
      <path d="M312.6 197.6A62.4 62.4 0 0 1 437.4 197.6" strokeDasharray="8 7" {...LINE} />
      <path d="M146.2 0V147.66A247 247 0 0 0 603.8 147.66V0" {...LINE} />
      <path d="M312.6 530A62.4 62.4 0 0 1 437.4 530" {...LINE} />
      <path d="M343.8 41.6H406.2M375 41.6V46.8" className="fill-none stroke-rpb-ink" strokeWidth={3} vectorEffect="non-scaling-stroke" />
      <circle
        cx={BASKET.cx}
        cy={BASKET.cy}
        r={BASKET.r}
        className="fill-none stroke-rpb-orange"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
