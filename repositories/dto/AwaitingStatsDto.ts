import { z } from "zod";
import { numeric } from "@/repositories/dto/numeric";

/** `GET /api/matchs/review` : matchs joués sans aucune ligne de statistiques. Seul l'identifiant sert. */
export const AwaitingStatsListDto = z.array(z.object({ idMatch: numeric }));
