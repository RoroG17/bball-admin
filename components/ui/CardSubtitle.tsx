import type { ReactNode } from "react";

type CardSubtitleProps = { children: ReactNode };

export function CardSubtitle({ children }: CardSubtitleProps) {
  return <p className="text-[13px] text-rpb-ink/72">{children}</p>;
}
