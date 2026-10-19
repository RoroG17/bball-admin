const OFFSET_FORMAT = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "longOffset" });

/** Décalage d'`Europe/Paris` à cet instant, en minutes (`+60` l'hiver, `+120` l'été). Aucune table de dates en dur. */
export function getParisOffsetMinutes(instant: Date): number {
  const name = OFFSET_FORMAT.formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/^GMT(?:([+-])(\d{2}):(\d{2}))?$/);
  if (!match || !match[1]) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}
