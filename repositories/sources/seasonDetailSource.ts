import "server-only";
import { cache } from "react";
import { ApiError } from "@/lib/ApiError";
import { apiGet } from "@/lib/http";

/**
 * `GET /api/saisons/{id}` une seule fois par requête serveur. Renvoie le JSON brut : chaque repository valide sa
 * tranche (la saison, les participants), une erreur de format de l'une n'affecte pas l'autre. `null` si la saison n'existe
 * pas (404). Ne jamais journaliser le payload.
 */
export const fetchSeasonDetailPayload = cache(async (seasonId: number, token: string): Promise<unknown | null> => {
  try {
    return await apiGet(`/api/saisons/${seasonId}`, { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
