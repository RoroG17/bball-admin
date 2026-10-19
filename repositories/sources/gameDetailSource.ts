import "server-only";
import { cache } from "react";
import { ApiError } from "@/lib/ApiError";
import { apiGet } from "@/lib/http";
import { getCurrentSession } from "@/repositories/SessionRepository";

/**
 * `GET /api/matchs/{id}` une seule fois par requête serveur. Renvoie le JSON brut : chaque repository
 * valide sa tranche. `null` si le match n'existe pas (404).
 * Ne JAMAIS journaliser le payload : il contient des données personnelles (P2).
 */
export const fetchGameDetailPayload = cache(async (gameId: number): Promise<unknown | null> => {
  const session = await getCurrentSession();
  try {
    return await apiGet(`/api/matchs/${gameId}`, { token: session?.token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
