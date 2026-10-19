import type { IconProps } from "@/components/ui/icons/IconProps";

export function EqualIcon({ size = 24, strokeWidth = 3, className }: IconProps) {
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
      <path d="M5 9h14M5 15h14" />
    </svg>
  );
}
