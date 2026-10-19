import "server-only";
import { cache } from "react";
import { ApiError } from "@/lib/ApiError";
import { apiGet } from "@/lib/http";
import { getCurrentSession } from "@/repositories/SessionRepository";

/**
 * `GET /api/joueurs/{licence}` une seule fois par requête serveur. Renvoie le JSON brut : chaque repository valide SA
 * tranche (`joueur`, `stats`, `examens`). `null` si le joueur n'existe pas (404).
 * Ne JAMAIS journaliser le payload : date de naissance, examens, mesures (P1, P2).
 */
export const fetchPlayerDetailPayload = cache(async (licence: string): Promise<unknown | null> => {
  const session = await getCurrentSession();
  try {
    return await apiGet(`/api/joueurs/${encodeURIComponent(licence)}`, { token: session?.token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
