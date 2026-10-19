import { z } from "zod";

export const PlayerSchema = z.object({
  licence: z.string().min(1),
  lastName: z.string(),
  firstName: z.string(),
  photoUrl: z.url().nullable(),
});

export type Player = z.infer<typeof PlayerSchema>;
