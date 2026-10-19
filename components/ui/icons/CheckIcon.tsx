import type { IconProps } from "@/components/ui/icons/IconProps";

export function CheckIcon({ size = 24, strokeWidth = 3, className }: IconProps) {
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
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}
