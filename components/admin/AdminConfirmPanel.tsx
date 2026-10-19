import { useId, type ReactNode } from "react";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { animationDelay } from "@/lib/animationDelay";

type AdminConfirmPanelProps = {
  title: string;
  /** Sujet sous le titre : fichier de logo, licence… */
  subject?: string;
  warning?: string;
  /** Élément à gauche du titre (logo de l'équipe). */
  leading?: ReactNode;
  children: ReactNode;
};

/** Panneau de confirmation d'une suppression : bordure `danger`, avertissement en icône + texte (jamais la couleur seule). */
export function AdminConfirmPanel({ title, subject, warning, leading, children }: AdminConfirmPanelProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="reveal flex w-full max-w-[720px] min-w-0 flex-col gap-4 rounded-lg border-2 border-danger bg-rpb-cream p-5 shadow-card"
      style={animationDelay(80)}
    >
      <div className="flex items-center gap-3.5">
        {leading}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={titleId} className="font-display text-xl leading-tight font-extrabold wrap-anywhere">
            {title}
          </h2>
          {subject && <p className="text-[13px]/5 text-rpb-ink/72 wrap-anywhere">{subject}</p>}
        </div>
      </div>
      {warning && (
        <p className="flex items-start gap-3 rounded-lg border-2 border-danger px-3.5 py-3 text-[15px]/[22px] font-semibold">
          <AlertTriangleIcon size={22} className="mt-px shrink-0 text-danger" />
          <span>{warning}</span>
        </p>
      )}
      {children}
    </section>
  );
}
