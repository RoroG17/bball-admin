import { getParisDayStartUtc } from "@/models/getParisDayStartUtc";
import { isValidIsoDate } from "@/models/isValidIsoDate";

/**
 * Dernière seconde du jour de Paris : début du jour suivant moins une seconde (gère les journées de 23 h et de 25 h).
 * Lève `RangeError` si la date n'existe pas.
 */
export function getParisDayEndUtc(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) throw new RangeError(`Date invalide : ${isoDate}`);
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const nextStart = new Date(getParisDayStartUtc(next)).getTime();
  return `${new Date(nextStart - 1000).toISOString().slice(0, 19)}Z`;
}
