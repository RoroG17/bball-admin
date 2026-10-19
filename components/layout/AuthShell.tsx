import type { ReactNode } from "react";
import { RpbCrest } from "@/components/layout/RpbCrest";

type AuthShellProps = {
  /** Texte du `<h1>`. */
  title: string;
  /** Accroche sous le titre (DS82). */
  lead: string;
  children: ReactNode;
};

/**
 * Cadre des pages publiques (connexion, première connexion) : carte centrée avec bandeau de marque, sans en-tête ni
 * menu (DS73). Logo décoratif dans le bandeau (DS74) : écusson provisoire en attendant `public/rpb-logo.png`.
 */
export function AuthShell({ title, lead, children }: AuthShellProps) {
  return (
    <main className="anim flex min-h-dvh flex-1 items-center justify-center px-5 py-10">
      <section
        aria-labelledby="auth-title"
        className="reveal w-full max-w-[480px] overflow-hidden rounded-lg border-2 border-rpb-ink bg-rpb-cream shadow-score"
      >
        <div className="flex items-center gap-3.5 border-b-[3px] border-rpb-ink bg-rpb-bordeaux px-5 py-4 text-rpb-cream">
          <RpbCrest height={56} />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-display text-[26px] leading-none font-black tracking-[.02em]">BBall Admin</p>
            <p className="text-[13px] leading-5 text-rpb-gold-light">Statistiques du club RPB</p>
          </div>
        </div>
        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1.5">
            <h1 id="auth-title" className="font-display text-[32px] leading-[1.1] font-black">
              {title}
            </h1>
            <p className="text-[15px]/[22px] text-rpb-ink/72">{lead}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
