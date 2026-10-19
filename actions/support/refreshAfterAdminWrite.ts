import "server-only";
import { updateTag } from "next/cache";
import { revalidateTargets } from "@/actions/support/revalidateTargets";
import { HALL_OF_FAME_CACHE_TAG } from "@/lib/cacheTags";
import type { AdminEntity } from "@/models/AdminEntity";
import { ADMIN_REVALIDATION, type AdminWriteKind } from "@/models/adminRevalidation";

/**
 * Rafraîchit ce qu'une écriture admin change : `revalidatePath` des cibles de `ADMIN_REVALIDATION[entity]`, et
 * `updateTag` du palmarès si `kind` figure dans `hallOfFameOn`. À appeler après un `ok` ET après un `notFound` sur
 * suppression (la ligne fantôme disparaît). Server Action uniquement (contrainte de `updateTag`).
 */
export function refreshAfterAdminWrite(entity: Exclude<AdminEntity, "logs">, kind: AdminWriteKind): void {
  const rule = ADMIN_REVALIDATION[entity];
  revalidateTargets(rule.targets);
  if (rule.hallOfFameOn.includes(kind)) updateTag(HALL_OF_FAME_CACHE_TAG);
}
