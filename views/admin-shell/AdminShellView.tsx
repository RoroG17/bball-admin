import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

type AdminShellViewProps = { children: ReactNode };

/**
 * Cadre de la zone admin : navigation entre rubriques puis contenu. Aucune donnée, AUCUNE garde (un layout ne se
 * re-rend pas à la navigation) : chaque vue appelle `requireAdmin()`.
 */
export function AdminShellView({ children }: AdminShellViewProps) {
  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
