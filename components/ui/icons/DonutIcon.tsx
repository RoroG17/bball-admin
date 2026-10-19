import type { IconProps } from "@/components/ui/icons/IconProps";

export function DonutIcon({ size = 24, strokeWidth = 1.6, className }: IconProps) {
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
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v5M21.5 12h-5" />
    </svg>
  );
}
