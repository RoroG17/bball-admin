import { getParisOffsetMinutes } from "@/models/getParisOffsetMinutes";
import { isValidIsoDate } from "@/models/isValidIsoDate";

const MINUTE_MS = 60_000;

/** `YYYY-MM-DDTHH:mm:ssZ` (sans fraction). */
function toUtcSeconds(instant: Date): string {
  return `${instant.toISOString().slice(0, 19)}Z`;
}

/**
 * Instant UTC de 00:00:00 heure de Paris du jour `YYYY-MM-DD`. Le décalage est relu à l'instant obtenu, ce qui gère les
 * jours de changement d'heure. Lève `RangeError` si la date n'existe pas.
 */
export function getParisDayStartUtc(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) throw new RangeError(`Date invalide : ${isoDate}`);
  const [year, month, day] = isoDate.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day);
  let start = guess - getParisOffsetMinutes(new Date(guess)) * MINUTE_MS;
  const corrected = guess - getParisOffsetMinutes(new Date(start)) * MINUTE_MS;
  if (corrected !== start) start = corrected;
  return toUtcSeconds(new Date(start));
}
