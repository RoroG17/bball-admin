import "server-only";
import { redirect } from "next/navigation";
import { readRequestPath } from "@/lib/readRequestPath";
import { buildSessionExpiredHref } from "@/models/buildSessionExpiredHref";

/**
 * Le cookie ne peut pas être supprimé pendant le rendu : on passe par le Route Handler `/session/expired`, qui le
 * supprime puis renvoie vers la connexion.
 */
export async function redirectToSessionExpired(): Promise<never> {
  redirect(buildSessionExpiredHref(await readRequestPath()));
}
