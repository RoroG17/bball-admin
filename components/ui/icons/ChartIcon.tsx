import type { IconProps } from "@/components/ui/icons/IconProps";

export function ChartIcon({ size = 24, strokeWidth = 1.6, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <rect x="5" y="12" width="3" height="9" />
      <rect x="10.5" y="6" width="3" height="15" />
      <rect x="16" y="9" width="3" height="12" />
    </svg>
  );
}
