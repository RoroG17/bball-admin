import type { AdminEntity } from "@/models/AdminEntity";

export type AdminHrefTarget = "list" | "create" | { kind: "edit" | "delete" | "reset"; id: string | number };

/**
 * Seul constructeur d'URL de la zone admin : `/admin/<entité>`, `/admin/<entité>/create`,
 * `/admin/<entité>/<id>/<kind>`. L'identifiant est encodé. Les journaux n'ont qu'une liste.
 */
export function buildAdminHref(entity: AdminEntity, target: AdminHrefTarget = "list"): string {
  const base = `/admin/${entity}`;
  if (target === "list") return base;
  if (entity === "logs") throw new Error("Les journaux n'ont ni création, ni modification, ni suppression.");
  if (target === "create") return `${base}/create`;
  return `${base}/${encodeURIComponent(String(target.id))}/${target.kind}`;
}
