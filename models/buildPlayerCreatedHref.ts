/** `/admin/player/{licence}/created` : segment que `buildAdminHref` ne connaît pas. La licence est encodée. */
export function buildPlayerCreatedHref(licence: string): string {
  return `/admin/player/${encodeURIComponent(licence)}/created`;
}
