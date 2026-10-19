import { z } from "zod";
import { numeric } from "@/repositories/dto/numeric";

/** Réponse de `POST /api/matchs` (201) : le modèle créé, de clé primaire `Id_Match`. Seul l'identifiant sert (R-ECR-1). */
export const CreatedGameDto = z.object({ Id_Match: numeric });
