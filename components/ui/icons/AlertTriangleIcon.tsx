import type { IconProps } from "@/components/ui/icons/IconProps";

export function AlertTriangleIcon({ size = 24, strokeWidth = 2, className }: IconProps) {
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
      <path d="M10.3 3.9L1.8 18.5A2 2 0 003.5 21.5h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
      <path d="M12 9v4.5M12 17.5h.01" />
    </svg>
  );
}
