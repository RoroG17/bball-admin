import Link from "next/link";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { NavLink } from "@/components/layout/NavLink";
import { getUserInitials } from "@/models/getUserInitials";

type AppHeaderProps = {
  username: string | null;
  /** Bouton « Déconnexion » toujours visible, sans sous-menu (tablette partagée, S10). */
  showLogout?: boolean;
  /** Entrée « Administration ». Cosmétique : la garde est dans chaque vue et chaque action admin. */
  showAdminLink?: boolean;
};

/** Liens provisoires : les pages correspondantes arrivent avec leurs features. */
const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/game", label: "Calendrier" },
  { href: "/player", label: "Joueurs" },
  { href: "/hall-of-fame", label: "Palmarès" },
  { href: "/physical", label: "Physique" },
];

const ADMIN_NAV_ITEM = { href: "/admin", label: "Administration" };

export function AppHeader({ username, showLogout = false, showAdminLink = false }: AppHeaderProps) {
  const navItems = showAdminLink ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  return (
    <header className="border-b-[3px] border-rpb-ink bg-rpb-bordeaux text-rpb-cream">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-7 gap-y-2 px-5">
        <Link href="/" className="flex items-center gap-2.5 py-2 text-rpb-cream no-underline focus-ring">
          {/* Emplacement du logo RPB, en attendant public/rpb-logo.png */}
          <span aria-hidden="true" className="h-10 w-[34px] rounded-md border-2 border-rpb-gold bg-rpb-bordeaux-dark" />
          <span className="font-display text-xl font-black tracking-[.02em]">BBall Admin</span>
        </Link>
        <nav aria-label="Navigation principale" className="flex flex-auto flex-wrap gap-x-[22px] gap-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        {(username || showLogout) && (
          <div className="flex items-center gap-2.5 py-1">
            {username && (
              <>
                <span className="text-sm">{username}</span>
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-rpb-gold font-display text-[13px] font-extrabold text-rpb-ink"
                >
                  {getUserInitials(username)}
                </span>
              </>
            )}
            {showLogout && <LogoutButton />}
          </div>
        )}
      </div>
    </header>
  );
}
