import type { ReactNode } from "react";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type AdminEmptyStateProps = {
  /** `none` : aucun enregistrement (lien de création) ; `noMatch` : recherche ou filtre sans résultat (réinitialisation). */
  kind: "none" | "noMatch";
  title: string;
  text?: string;
  /** Icône au trait 40 × 40 (décorative). */
  icon?: ReactNode;
  /** Légende de comptage, comme celle du tableau : « 0 équipe sur 14 ». */
  caption?: string;
  action: { href: string; label: string; prefetch?: boolean };
};

/** État vide d'une liste : garde le cadre du tableau chargé, avec son action. */
export function AdminEmptyState({ kind, title, text, icon, caption, action }: AdminEmptyStateProps) {
  return (
    <section className="reveal flex flex-col items-center gap-4 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream px-5 py-6 shadow-card">
      {caption && <p className="self-stretch text-[13px]/5 text-rpb-ink/72 tabular-nums">{caption}</p>}
      <EmptyState icon={icon} title={title} text={text} />
      <PrimaryButton href={action.href} prefetch={action.prefetch} variant={kind === "none" ? "primary" : "outline"}>
        {kind === "none" && <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />}
        {action.label}
      </PrimaryButton>
    </section>
  );
}
