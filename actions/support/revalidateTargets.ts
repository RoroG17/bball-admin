import "server-only";
import { revalidatePath } from "next/cache";
import type { RevalidationTarget } from "@/models/adminRevalidation";

/** `revalidatePath` de chaque cible ; un motif dynamique passe son `type`. Server Action uniquement. */
export function revalidateTargets(targets: readonly RevalidationTarget[]): void {
  for (const target of targets) {
    if (typeof target === "string") revalidatePath(target);
    else revalidatePath(target.pattern, target.type);
  }
}
