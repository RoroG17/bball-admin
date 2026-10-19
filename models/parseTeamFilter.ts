/** Filtre `?equipe=` : entier positif sans zéro initial, sinon `null` (absent ou invalide). */
export function parseTeamFilter(raw: string | undefined): number | null {
  return raw !== undefined && /^[1-9]\d{0,9}$/.test(raw) ? Number(raw) : null;
}
