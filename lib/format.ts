const NBSP = "\u00A0";

export type CountKind = "integer" | "decimal" | "percent";

/** `12.5` → `"12,5"`, `12` → `"12"`. */
export function formatDecimal(n: number, maxDigits = 1): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: maxDigits, minimumFractionDigits: 0 }).format(n);
}

/** Valeur signée : `124` → `"+124"`, `-4` → `"−4"` (signe moins U+2212), `0` → `"0"`. */
export function formatSignedDecimal(n: number, maxDigits = 1): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: 0,
    signDisplay: "exceptZero",
  })
    .format(n)
    .replace("-", "−");
}

/** Ratio entre 0 et 1 : `0.727` → `"73 %"`. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}${NBSP}%`;
}

/** Valeur déjà en points de pourcentage (0–100) : `57.6` → `"58 %"`. */
export function formatPercentPoints(value: number): string {
  return `${Math.round(value)}${NBSP}%`;
}

/** Décimales fixes : `(12, 1)` → `"12,0"`, `(12.54, 1)` → `"12,5"`, `(1480, 0)` → `"1 480"`. */
export function formatFixedDecimal(n: number, digits: number): string {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** Valeur en points de pourcentage (0–100) à décimales fixes : `(72.6)` → `"72,6 %"`, `(100)` → `"100,0 %"`. */
export function formatPercentPointsFixed(value: number, digits = 1): string {
  return `${formatFixedDecimal(value, digits)}${NBSP}%`;
}

/** Formatage d'un chiffre animé (`CountUp`). `percent` attend une valeur entre 0 et 100. */
export function formatCount(n: number, kind: CountKind): string {
  if (kind === "integer") return formatDecimal(Math.round(n), 0);
  if (kind === "percent") return formatPercentPoints(n);
  return formatDecimal(n, 1);
}

function isoDateToUtc(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** `"2026-10-12"` → `"lundi 12 octobre 2026"`, sans décalage de fuseau. */
export function formatGameDate(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(isoDateToUtc(isoDate));
}

/** `"2026-02-21"` → `"samedi 21 février"`. */
export function formatGameDateShort(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    isoDateToUtc(isoDate),
  );
}

/** Accord en nombre, singulier pour 0 et 1 : `pluralize(2, "match nul", "matchs nuls")` → `"2 matchs nuls"`. */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatDecimal(count, 0)} ${Math.abs(count) > 1 ? plural : singular}`;
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toLocaleUpperCase("fr-FR") + text.slice(1);
}

const EM_DASH = "—";

/** Temps de jeu en secondes → `"mm:ss"`, minutes non plafonnées : `1453` → `"24:13"`, `3840` → `"64:00"`, `null` → `"—"`. */
export function formatPlayingTime(seconds: number | null): string {
  if (seconds === null) return EM_DASH;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Ratio entre 0 et 1 avec décimales : `0.3871` → `"38,7 %"`, `1` → `"100 %"`, `null` → `"—"`. */
export function formatPercentDecimal(ratio: number | null, maxDigits = 1): string {
  if (ratio === null) return EM_DASH;
  return `${formatDecimal(ratio * 100, maxDigits)}${NBSP}%`;
}

/** Réussis / tentés : `(12, 31)` → `"12/31"`. */
export function formatShootingRatio(made: number, attempted: number): string {
  return `${formatDecimal(made, 0)}/${formatDecimal(attempted, 0)}`;
}

const LONG_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/** `"2026-03-12"` → long `"12 mars 2026"`, court `"12/03/2026"`, sans décalage de fuseau. */
export function formatDate(isoDate: string, style: "long" | "short" = "long"): string {
  return (style === "long" ? LONG_DATE : SHORT_DATE).format(isoDateToUtc(isoDate));
}

/** `(182, "cm")` → `"182 cm"`, `(14.5, "km/h")` → `"14,5 km/h"` (espace insécable). */
export function formatMeasurementValue(value: number, unit: string): string {
  return `${formatDecimal(value)}${NBSP}${unit}`;
}

const DATE_TIME_PARTS: Record<"Europe/Paris" | "UTC", Intl.DateTimeFormat> = {
  "Europe/Paris": new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }),
  UTC: new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }),
};

/**
 * Instant ISO UTC → `"12/10/2026 14:02:11"` (jour/mois/année, heures 00-23, secondes toujours affichées), dans le
 * fuseau demandé. Composé avec `formatToParts` (indépendant de la ponctuation ICU). Entrée invalide : `"—"`.
 */
export function formatDateTime(isoUtc: string, timeZone: "Europe/Paris" | "UTC"): string {
  const instant = new Date(isoUtc);
  if (Number.isNaN(instant.getTime())) return EM_DASH;
  const parts = Object.fromEntries(
    DATE_TIME_PARTS[timeZone].formatToParts(instant).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** `845` → `"845 ms"`, `1234` → `"1 234 ms"` (espace insécable avant l'unité). */
export function formatDurationMs(ms: number): string {
  return `${formatDecimal(ms, 0)}${NBSP}ms`;
}
