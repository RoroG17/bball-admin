import { z } from "zod";

export const SeasonSchema = z.object({
  id: z.number().int().positive(),
  startYear: z.number().int(),
  endYear: z.number().int(),
  championship: z.string(),
  category: z.string(),
  /** Équipe RPB de la saison. */
  teamId: z.number().int().nullable(),
});

export type Season = z.infer<typeof SeasonSchema>;
