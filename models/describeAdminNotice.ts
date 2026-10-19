import { ADMIN_ENTITY_NOUNS, type AdminEntity } from "@/models/AdminEntity";
import type { AdminNoticeCode } from "@/models/AdminNotice";
import { capitalizeFirst } from "@/lib/format";

const PARTICIPLES: Record<"created" | "updated" | "deleted", { m: string; f: string }> = {
  created: { m: "créé", f: "créée" },
  updated: { m: "modifié", f: "modifiée" },
  deleted: { m: "supprimé", f: "supprimée" },
};

/**
 * Phrase du bandeau de résultat : « Joueur « Lucas Marchand » créé. », « Équipe supprimée. ». Le `label` vient de la
 * vue (jamais de l'URL) ; `deleted` ne l'affiche jamais (l'élément n'existe plus).
 */
export function describeAdminNotice(code: AdminNoticeCode, entity: AdminEntity, label: string | null): string {
  if (code === "reset") return "Mot de passe réinitialisé.";
  const { singular, gender } = ADMIN_ENTITY_NOUNS[entity];
  const name = capitalizeFirst(singular);
  const trimmed = label?.trim();
  const subject = code !== "deleted" && trimmed ? `${name} « ${trimmed} »` : name;
  return `${subject} ${PARTICIPLES[code][gender]}.`;
}
