import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type DisclosureProps = {
  summary: string;
  /** `sm` : 14px (classements) ; `md` : 15px (effectif). */
  size?: "sm" | "md";
  children: ReactNode;
};

export function Disclosure({ summary, size = "md", children }: DisclosureProps) {
  return (
    <details>
      <summary
        className={cx(
          "cursor-pointer rounded-md py-2.5 font-semibold text-rpb-bordeaux hover:text-rpb-bordeaux-dark focus-ring",
          size === "sm" ? "text-sm" : "text-[15px]",
        )}
      >
        {summary}
      </summary>
      {children}
    </details>
  );
}
