"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { isActivePath } from "@/lib/isActivePath";

type AdminNavLinkProps = {
  href: string;
  label: string;
};

/** Lien de rubrique. L'état actif vient de `usePathname` : un layout ne se re-rend pas à la navigation. */
export function AdminNavLink({ href, label }: AdminNavLinkProps) {
  const active = isActivePath(usePathname(), href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex min-h-12 items-center border-b-4 px-0.5 text-[15px] no-underline transition-colors focus-ring",
        active
          ? "border-rpb-gold font-bold text-rpb-cream"
          : "border-transparent font-medium text-rpb-cream hover:border-rpb-gold-light hover:text-rpb-gold-light",
      )}
    >
      {label}
    </Link>
  );
}
