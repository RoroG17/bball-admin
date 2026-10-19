import type { IconProps } from "@/components/ui/icons/IconProps";

export function SortIcon({ size = 24, strokeWidth = 2, className }: IconProps) {
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
      <path d="M8 9.5l4-4 4 4" />
      <path d="M8 14.5l4 4 4-4" />
    </svg>
  );
}
