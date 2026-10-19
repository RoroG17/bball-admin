import type { AdminNoticeCode } from "@/models/AdminNotice";

/** Codes qui portent une `ref` (l'élément créé ou modifié, mis en évidence dans la liste). */
const CODES_WITH_REF: readonly AdminNoticeCode[] = ["created", "updated"];

/**
 * Ajoute `notice` (et `ref` pour `created` / `updated`) EN DERNIER dans la requête de `href` (C8). Une notice déjà
 * présente est retirée avant (pas de duplication) ; le fragment reste à la fin ; les autres paramètres gardent leur
 * encodage.
 */
export function appendAdminNotice(
  href: string,
  notice: { code: AdminNoticeCode; ref?: string | number | null },
): string {
  const hashIndex = href.indexOf("#");
  const fragment = hashIndex === -1 ? "" : href.slice(hashIndex);
  const withoutFragment = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const queryIndex = withoutFragment.indexOf("?");
  const path = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex);
  const kept = (queryIndex === -1 ? "" : withoutFragment.slice(queryIndex + 1))
    .split("&")
    .filter((pair) => pair !== "" && !/^(notice|ref)(=|$)/.test(pair));

  kept.push(`notice=${notice.code}`);
  const ref = notice.ref === undefined || notice.ref === null ? "" : String(notice.ref);
  if (ref !== "" && CODES_WITH_REF.includes(notice.code)) kept.push(`ref=${encodeURIComponent(ref)}`);
  return `${path}?${kept.join("&")}${fragment}`;
}
