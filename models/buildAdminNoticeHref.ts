import type { AdminEntity } from "@/models/AdminEntity";
import type { AdminNoticeCode } from "@/models/AdminNotice";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";

/** Liste de l'entité + `?notice=<code>` (+ `&ref=` pour `created` / `updated`). Cas particulier de `appendAdminNotice`. */
export function buildAdminNoticeHref(
  entity: AdminEntity,
  notice: { code: AdminNoticeCode; ref?: string | number },
): string {
  return appendAdminNotice(buildAdminHref(entity), notice);
}
