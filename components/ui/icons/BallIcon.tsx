import type { IconProps } from "@/components/ui/icons/IconProps";

type BallIconProps = IconProps & {
  /** Ballon plein orange (décoratif) ; sinon simple tracé. */
  filled?: boolean;
};

export function BallIcon({ size = 24, strokeWidth = 1.6, className, filled = false }: BallIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" className={filled ? "fill-rpb-orange stroke-rpb-ink" : undefined} />
      <path
        d="M2 12h20M12 2v20M5 4.9c2.6 2.2 3.9 4.6 3.9 7.1S7.6 16.9 5 19.1M19 4.9c-2.6 2.2-3.9 4.6-3.9 7.1s1.3 4.9 3.9 7.1"
        className={filled ? "stroke-rpb-ink" : undefined}
      />
    </svg>
  );
}
