import { AdminHubCard } from "@/components/admin/AdminHubCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_SECTIONS } from "@/models/AdminEntity";
import { requireAdmin } from "@/repositories/SessionRepository";

/** Accueil de l'administration : une carte par rubrique. Aucune lecture de données en V2.0. */
export async function AdminHomeView() {
  await requireAdmin();

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader title="Administration" breadcrumb={[{ label: "Administration" }]} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
        {ADMIN_SECTIONS.map((section, index) => (
          <AdminHubCard key={section.entity} entity={section.entity} index={index} />
        ))}
      </div>
    </main>
  );
}
