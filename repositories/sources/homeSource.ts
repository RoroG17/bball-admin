import "server-only";
import { cache } from "react";
import { apiGet } from "@/lib/http";
import { getCurrentSession } from "@/repositories/SessionRepository";

/**
 * Seul endpoint du back pour la page d'accueil. Appelé une seule fois par requête serveur
 * grâce à `cache()` ; chaque repository valide ensuite sa propre tranche.
 */
export const fetchHomePayload = cache(async (seasonId: number): Promise<unknown> => {
  const session = await getCurrentSession();
  return apiGet(`/accueil/${seasonId}`, { token: session?.token });
});
