import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { hasLinkedPlayer } from "@/models/hasLinkedPlayer";
import { hasPermission } from "@/models/hasPermission";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { NoLinkedPlayerNotice } from "@/views/app-shell/components/NoLinkedPlayerNotice";

type AppShellViewProps = { children: ReactNode };

/**
 * Cadre commun des pages connectées : en-tête, bandeau « compte sans joueur » éventuel, puis contenu de la page.
 * N'est PAS une garde (un layout ne se re-rend pas à chaque navigation) : chaque vue appelle `requireSession()`.
 */
export async function AppShellView({ children }: AppShellViewProps) {
  const session = await getCurrentSession();

  return (
    <>
      <AppHeader
        username={session?.username ?? null}
        showLogout={session !== null}
        showAdminLink={hasPermission(session, "accessAdmin")}
      />
      {session && !hasLinkedPlayer(session) && <NoLinkedPlayerNotice />}
      {children}
    </>
  );
}
