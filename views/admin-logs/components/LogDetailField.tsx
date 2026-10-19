import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type LogDetailFieldProps = { label: string; children: ReactNode; wide?: boolean };

/** Paire libellé / valeur du panneau de détail. */
export function LogDetailField({ label, children, wide = false }: LogDetailFieldProps) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-0.5", wide && "col-span-full")}>
      <dt className="text-[11px]/4 font-semibold tracking-[.08em] text-rpb-ink/72 uppercase">{label}</dt>
      <dd className="text-[15px]/[22px] font-semibold wrap-anywhere">{children}</dd>
    </div>
  );
}
