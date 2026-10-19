const MAX_INT = 2_147_483_647;

/** Identifiant de match du segment d'URL : entier positif sans signe ni espace, sinon `null` (aucun appel au back). */
export function parseGameId(raw: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id <= MAX_INT ? id : null;
}
