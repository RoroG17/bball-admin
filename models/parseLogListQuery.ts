import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import {
  LOG_FILTER_MAX_LENGTHS,
  LOG_PLATFORM_FILTERS,
  LOG_STATUS_FILTER_OPTIONS,
  type LogFilters,
  type LogPlatformFilter,
  type LogStatusFilter,
} from "@/models/LogFilters";
import { LOG_MAX_PAGE, type LogListQuery } from "@/models/LogListQuery";
import { LOG_SOURCES, type LogSource } from "@/models/LogSource";
import { getActiveLogFilters } from "@/models/getActiveLogFilters";
import { isValidIsoDate } from "@/models/isValidIsoDate";
import { parseLogKind } from "@/models/parseLogKind";
import type { RawLogQuery } from "@/models/RawLogQuery";

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/** Première valeur, rognée ; vide = absente. */
function readValue(raw: RawLogQuery, key: string): string | undefined {
  const value = raw[key];
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

/** Texte libre : rejeté (jamais tronqué) s'il dépasse `maxLength` caractères ou contient un caractère de contrôle. */
function readText(raw: RawLogQuery, key: string, maxLength: number): string | undefined {
  const value = readValue(raw, key);
  if (value === undefined || CONTROL_CHARACTERS.test(value) || Array.from(value).length > maxLength) return undefined;
  return value;
}

function readDate(raw: RawLogQuery, key: string): string | undefined {
  const value = readValue(raw, key);
  return value !== undefined && isValidIsoDate(value) ? value : undefined;
}

function readPage(raw: RawLogQuery): number {
  const value = readValue(raw, "page");
  if (value === undefined || !/^[1-9]\d{0,5}$/.test(value)) return 1;
  const page = Number(value);
  return page <= LOG_MAX_PAGE ? page : 1;
}

function readDetailId(raw: RawLogQuery): number | null {
  const value = readValue(raw, "detail");
  return value !== undefined && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
}

/**
 * Paramètres d'URL → requête de liste valide. Un filtre inactif (non appliqué par le back) ou invalide est écarté ; une
 * période inversée est redressée (D-L5) ; `per_page`, `sort` et toute clé inconnue sont ignorés (P9).
 */
export function parseLogListQuery(raw: RawLogQuery, support: LogBackSupportTable = LOG_BACK_SUPPORT): LogListQuery {
  const kind = parseLogKind(readValue(raw, "type"), support);
  const active = getActiveLogFilters(kind, support);
  const filters: LogFilters = {};

  if (active.includes("utilisateur")) filters.utilisateur = readText(raw, "utilisateur", LOG_FILTER_MAX_LENGTHS.utilisateur);
  if (active.includes("plateforme")) {
    const platform = readValue(raw, "plateforme");
    filters.plateforme = LOG_PLATFORM_FILTERS.find((candidate: LogPlatformFilter) => candidate === platform);
  }
  if (active.includes("os")) filters.os = readText(raw, "os", LOG_FILTER_MAX_LENGTHS.os);
  if (active.includes("source")) {
    const source = readValue(raw, "source");
    filters.source = LOG_SOURCES.find((candidate: LogSource) => candidate === source);
  }
  if (active.includes("route")) filters.route = readText(raw, "route", LOG_FILTER_MAX_LENGTHS.route);
  if (active.includes("statut")) {
    const status = readValue(raw, "statut");
    filters.statut = LOG_STATUS_FILTER_OPTIONS[kind].find((candidate: LogStatusFilter) => candidate === status);
  }
  if (active.includes("du")) filters.du = readDate(raw, "du");
  if (active.includes("au")) filters.au = readDate(raw, "au");

  if (filters.du !== undefined && filters.au !== undefined && filters.du > filters.au) {
    [filters.du, filters.au] = [filters.au, filters.du];
  }

  const cleaned = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined)) as LogFilters;
  return { kind, filters: cleaned, page: readPage(raw), detailId: readDetailId(raw) };
}
