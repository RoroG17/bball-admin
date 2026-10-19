import type { IconProps } from "@/components/ui/icons/IconProps";

type PlayIconProps = IconProps & {
  /** Triangle plein ; sinon simple tracé. */
  filled?: boolean;
};

export function PlayIcon({ size = 24, strokeWidth = 2, className, filled = false }: PlayIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  );
}
