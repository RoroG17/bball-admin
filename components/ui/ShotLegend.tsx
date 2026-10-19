export function ShotLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]/[18px] font-semibold">
      <li className="flex items-center gap-1.5">
        <svg width={16} height={16} viewBox="-14 -14 28 28" aria-hidden="true">
          <circle r={11} className="fill-success stroke-rpb-ink" strokeWidth={1.5} />
        </svg>
        Réussi
      </li>
      <li className="flex items-center gap-1.5">
        <svg width={16} height={16} viewBox="-14 -14 28 28" aria-hidden="true">
          <path d="M-9 -9L9 9M9 -9L-9 9" className="fill-none stroke-danger" strokeWidth={3} strokeLinecap="round" />
        </svg>
        Manqué
      </li>
    </ul>
  );
}
