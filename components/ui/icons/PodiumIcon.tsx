import type { IconProps } from "@/components/ui/icons/IconProps";

export function PodiumIcon({ size = 24, strokeWidth = 1.6, className }: IconProps) {
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
      <path d="M8.5 21V9.5h7V21M2.5 21v-7h6M15.5 21v-5h6v5M1.5 21h21" />
      <path d="M12 2.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" />
    </svg>
  );
}
