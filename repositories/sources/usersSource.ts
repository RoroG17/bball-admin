import "server-only";
import { cache } from "react";
import { apiGet } from "@/lib/http";

/**
 * `GET /api/users`, lecture BRUTE et FRAÎCHE (jamais mise en cache) : seul endroit qui appelle cette route (C5).
 * Les actions qui doivent décider sur l'état réel du back (`resolveAccountTarget`) passent par ici.
 */
export async function fetchUsersPayloadFresh(token: string): Promise<unknown> {
  return apiGet("/api/users", { token });
}

/**
 * `GET /api/users`, une seule fois par requête serveur (C5), pour les rendus. Renvoie le JSON brut : chaque repository
 * valide SA tranche avec son propre DTO (isolation des erreurs, règle `.CLAUDE.md`).
 */
export const fetchUsersPayload = cache(async (token: string): Promise<unknown> => fetchUsersPayloadFresh(token));
