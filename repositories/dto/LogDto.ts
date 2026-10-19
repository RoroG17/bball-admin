import { z } from "zod";
import { LOG_SOURCES } from "@/models/LogSource";
import { numeric } from "@/repositories/dto/numeric";

/**
 * Lignes de `error_logs` / `request_logs` (`LogController`), `with('user:id,username')`. Validation STRICTE par ligne :
 * une ligne invalide fait échouer le bloc (D-L11), jamais une ligne silencieusement perdue. `platform` reste une chaîne
 * libre en base. `created_at` : ISO 8601 UTC (cast `datetime`).
 */
export const LogUserDto = z.object({ id: numeric, username: z.string() });

export const RequestLogDto = z.object({
  id: numeric,
  user_id: numeric.nullable(),
  method: z.string(),
  route: z.string(),
  status_code: z.number().int(),
  duration_ms: z.number().int().nonnegative(),
  platform: z.string().nullable(),
  os: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  ip_address: z.string().nullable(),
  created_at: z.iso.datetime(),
  user: LogUserDto.nullable(),
});
export type RequestLogRow = z.infer<typeof RequestLogDto>;

export const ErrorLogDto = z.object({
  id: numeric,
  user_id: numeric.nullable(),
  platform: z.string().nullable(),
  os: z.string().nullable(),
  message: z.string(),
  route: z.string().nullable(),
  method: z.string().nullable(),
  status_code: z.number().int().nullable(),
  context: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  source: z.enum(LOG_SOURCES),
  created_at: z.iso.datetime(),
  user: LogUserDto.nullable(),
});
export type ErrorLogRow = z.infer<typeof ErrorLogDto>;
