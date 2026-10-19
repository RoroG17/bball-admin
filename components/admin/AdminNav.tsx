import { AdminNavLink } from "@/components/admin/AdminNavLink";
import { ADMIN_SECTIONS } from "@/models/AdminEntity";
import { buildAdminHref } from "@/models/buildAdminHref";

/** Bande de navigation entre les six rubriques de l'administration, sous l'en-tête de l'application. */
export function AdminNav() {
  return (
    <div className="border-b-[3px] border-rpb-ink bg-rpb-bordeaux-dark text-rpb-cream">
      <nav aria-label="Administration" className="mx-auto flex max-w-[1200px] flex-wrap gap-x-6 px-5">
        {ADMIN_SECTIONS.map((section) => (
          <AdminNavLink key={section.entity} href={buildAdminHref(section.entity)} label={section.label} />
        ))}
      </nav>
    </div>
  );
}
