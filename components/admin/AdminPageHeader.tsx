import type { ReactNode } from "react";
import { AdminBreadcrumb, type AdminBreadcrumbItem } from "@/components/admin/AdminBreadcrumb";

type AdminPageHeaderProps = {
  /** `<h1>` unique de la page. */
  title: string;
  breadcrumb: readonly AdminBreadcrumbItem[];
  /** Actions de la page (ex. « Nouvelle équipe »). */
  actions?: ReactNode;
};

/** En-tête d'une page admin : fil d'Ariane, titre et actions. Le `<main>` parent porte `anim` et `@container`. */
export function AdminPageHeader({ title, breadcrumb, actions }: AdminPageHeaderProps) {
  return (
    <header className="reveal flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1">
        <AdminBreadcrumb items={breadcrumb} />
        <h1 className="font-display text-[28px] leading-[1.1] font-black wrap-anywhere @2xl:text-[40px]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
