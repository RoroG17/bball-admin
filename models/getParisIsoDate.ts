const parisDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Date du jour `YYYY-MM-DD` à Paris. */
export function getParisIsoDate(now: Date): string {
  return parisDate.format(now);
}
