import type { IconProps } from "@/components/ui/icons/IconProps";

export function LogOutIcon({ size = 24, strokeWidth = 2, className }: IconProps) {
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
      <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H9" />
    </svg>
  );
}
