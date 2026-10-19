import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";

export type AdminBreadcrumbItem = { label: string; href?: string };

type AdminBreadcrumbProps = { items: readonly AdminBreadcrumbItem[] };

/** Fil d'Ariane : le dernier élément est la page courante, sans lien. */
export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-x-1.5 text-[13px]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold text-rpb-ink/72">
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRightIcon size={14} strokeWidth={2.5} className="text-rpb-ink/72" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
