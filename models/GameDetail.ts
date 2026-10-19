import { z } from "zod";
import { GameSchema } from "@/models/Game";
import { GameVideoSchema } from "@/models/GameVideo";

export const GameDetailSchema = z.object({
  /** `home.teamId` et `away.teamId` sont renseignés (`idDom` / `idExt`). */
  game: GameSchema,
  seasonId: z.number().int().positive(),
  video: GameVideoSchema,
});

export type GameDetail = z.infer<typeof GameDetailSchema>;
