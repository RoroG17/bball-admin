import { getParisIsoDate } from "@/models/getParisIsoDate";

/** Vrai si la date `YYYY-MM-DD` correspond au jour de `now` à Paris. */
export function isToday(isoDate: string, now: Date): boolean {
  return getParisIsoDate(now) === isoDate.slice(0, 10);
}
