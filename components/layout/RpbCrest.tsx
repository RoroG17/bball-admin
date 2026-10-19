type RpbCrestProps = {
  /** Hauteur en px ; la largeur suit le ratio du bouclier. */
  height: number;
};

/** Écusson provisoire (bouclier or, contour encre, « RPB » bordeaux), en attendant `public/rpb-logo.png`. Décoratif. */
export function RpbCrest({ height }: RpbCrestProps) {
  return (
    <svg width={Math.round(height * 0.85)} height={height} viewBox="0 0 34 40" aria-hidden="true" className="shrink-0">
      <path
        d="M3 3h28v17c0 9-6.5 14.5-14 17C9.5 34.5 3 29 3 20z"
        className="fill-rpb-gold stroke-rpb-ink"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="17"
        y="23.5"
        textAnchor="middle"
        className="fill-rpb-bordeaux font-display"
        fontWeight="900"
        fontSize="10.5"
      >
        RPB
      </text>
    </svg>
  );
}
