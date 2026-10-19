/**
 * Années proposées à la création : la saison sportive commence en juillet. `isoDate` = jour de Paris (`YYYY-MM-DD`).
 * À partir du 1er juillet : année en cours / suivante ; avant : année précédente / en cours.
 */
export function getDefaultSeasonYears(isoDate: string): { startYear: number; endYear: number } {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  return month >= 7 ? { startYear: year, endYear: year + 1 } : { startYear: year - 1, endYear: year };
}
