import {
  ADMIN_NOTICE_CODES,
  ADMIN_NOTICE_REF_MAX_LENGTH,
  type AdminNotice,
  type AdminNoticeCode,
} from "@/models/AdminNotice";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Lit `?notice=` et `?ref=` : code hors liste → `null` ; `ref` tronquée, jamais affichée telle quelle. */
export function parseAdminNotice(raw: { notice?: string | string[]; ref?: string | string[] }): AdminNotice | null {
  const code = firstValue(raw.notice);
  if (code === undefined || !(ADMIN_NOTICE_CODES as readonly string[]).includes(code)) return null;
  const ref = firstValue(raw.ref)?.slice(0, ADMIN_NOTICE_REF_MAX_LENGTH);
  return { code: code as AdminNoticeCode, ref: ref ? ref : null };
}
