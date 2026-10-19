import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  BBALL_API_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  /** Durée de cache du palmarès, en secondes ; `0` désactive le cache. */
  HISTORY_REVALIDATE_SECONDS: z.coerce.number().int().min(0).default(300),
});

export const env = EnvSchema.parse({
  BBALL_API_URL: process.env.BBALL_API_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  HISTORY_REVALIDATE_SECONDS: process.env.HISTORY_REVALIDATE_SECONDS,
});
