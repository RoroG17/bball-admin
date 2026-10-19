"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { isActivePath } from "@/lib/isActivePath";

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const active = isActivePath(usePathname(), href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "border-b-[3px] px-0.5 py-3.5 text-[15px] text-rpb-cream no-underline transition-colors hover:border-rpb-gold-light hover:text-rpb-gold-light focus-ring",
        active ? "border-rpb-gold font-bold" : "border-transparent font-medium",
      )}
    >
      {label}
    </Link>
  );
}
