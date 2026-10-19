import "server-only";
import { cache } from "react";
import { HALL_OF_FAME_CACHE_TAG } from "@/lib/cacheTags";
import { env } from "@/lib/env";
import { apiGet } from "@/lib/http";
import { getCurrentSession } from "@/repositories/SessionRepository";

/**
 * Seul endpoint du back pour le palmarès. Appelé une seule fois par rendu grâce à `cache()` ; chaque catégorie
 * valide ensuite sa propre tranche. Sans session, aucun appel n'est émis (la vue a déjà redirigé vers `/login`).
 * Le corps de la réponse n'est jamais journalisé (noms de joueurs).
 */
export const fetchHallOfFamePayload = cache(async (): Promise<unknown> => {
  const session = await getCurrentSession();
  if (!session) throw new Error("Session absente");
  return apiGet("/api/history", {
    token: session.token,
    revalidate: { seconds: env.HISTORY_REVALIDATE_SECONDS, tags: [HALL_OF_FAME_CACHE_TAG] },
  });
});
