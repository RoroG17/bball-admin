import "server-only";
import { getLogBackSupport } from "@/lib/getLogBackSupport";
import type { ErrorLogEntry } from "@/models/ErrorLogEntry";
import type { LogBackSupportTable } from "@/models/LogBackSupport";
import type { LogListQuery } from "@/models/LogListQuery";
import type { LogPosition } from "@/models/LogPosition";
import type { Page } from "@/models/Page";
import type { RequestLogEntry } from "@/models/RequestLogEntry";
import { ErrorLogDto, RequestLogDto, type ErrorLogRow, type RequestLogRow } from "@/repositories/dto/LogDto";
import { paginatedDto, toPage } from "@/repositories/dto/PaginatedDto";
import { fetchLogPayload } from "@/repositories/sources/logSource";
import { buildLogBackSearch } from "@/repositories/support/buildLogBackSearch";

const ErrorLogPageDto = paginatedDto(ErrorLogDto);
const RequestLogPageDto = paginatedDto(RequestLogDto);

function toPosition(latitude: number | null, longitude: number | null): LogPosition | null {
  return latitude !== null && longitude !== null ? { latitude, longitude } : null;
}

function toErrorLogEntry(row: ErrorLogRow): ErrorLogEntry {
  return {
    id: row.id,
    occurredAt: row.created_at,
    source: row.source,
    statusCode: row.status_code,
    message: row.message,
    route: row.route,
    method: row.method,
    user: row.user,
    platform: row.platform,
    os: row.os,
    context: row.context,
    position: toPosition(row.latitude, row.longitude),
  };
}

function toRequestLogEntry(row: RequestLogRow): RequestLogEntry {
  return {
    id: row.id,
    occurredAt: row.created_at,
    method: row.method,
    route: row.route,
    statusCode: row.status_code,
    durationMs: row.duration_ms,
    user: row.user,
    platform: row.platform,
    os: row.os,
    ipAddress: row.ip_address,
    position: toPosition(row.latitude, row.longitude),
  };
}

/**
 * Une page d'erreurs (`GET /api/logs/errors`). Une erreur HTTP, réseau ou de format est PROPAGÉE : elle reste dans le
 * bloc de la vue (« Réessayer »), jamais une liste vide trompeuse. Aucun `catch` : rien à intercepter ici.
 */
export async function listErrorLogs(
  query: LogListQuery,
  support: LogBackSupportTable = getLogBackSupport(),
): Promise<Page<ErrorLogEntry>> {
  if (query.kind !== "errors") throw new Error("listErrorLogs attend une requête de type erreurs.");
  const payload = await fetchLogPayload("errors", buildLogBackSearch(query, support));
  return toPage(ErrorLogPageDto.parse(payload), toErrorLogEntry);
}

/**
 * Une page de requêtes (`GET /api/logs/requests`). Tant que la route n'est pas branchée côté back (B-LOG-1), cette
 * méthode refuse AVANT tout appel : jamais de requête vers une route absente.
 */
export async function listRequestLogs(
  query: LogListQuery,
  support: LogBackSupportTable = getLogBackSupport(),
): Promise<Page<RequestLogEntry>> {
  if (query.kind !== "requests") throw new Error("listRequestLogs attend une requête de type requêtes.");
  if (!support.requests.available) throw new Error("Le journal des requêtes n'est pas disponible côté back.");
  const payload = await fetchLogPayload("requests", buildLogBackSearch(query, support));
  return toPage(RequestLogPageDto.parse(payload), toRequestLogEntry);
}
