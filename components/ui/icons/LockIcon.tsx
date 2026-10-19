import type { IconProps } from "@/components/ui/icons/IconProps";

export function LockIcon({ size = 24, strokeWidth = 2, className }: IconProps) {
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
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7.5a4 4 0 018 0V11" />
    </svg>
  );
}
