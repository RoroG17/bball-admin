import type { ReactNode } from "react";

type EmptyStateProps = {
  /** Icône au trait 40 × 40 (décorative). */
  icon?: ReactNode;
  title: string;
  text?: string;
};

export function EmptyState({ icon, title, text }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-4 text-center">
      {icon && <span className="text-rpb-bordeaux">{icon}</span>}
      <p className="text-base font-bold">{title}</p>
      {text && <p className="text-sm text-rpb-ink/72">{text}</p>}
    </div>
  );
}
