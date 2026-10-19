/** Identifiant d'équipe de l'URL : entier positif de 10 chiffres au plus, sans zéro initial. Sinon `null`. */
export function parseTeamId(raw: string): number | null {
  return /^[1-9]\d{0,9}$/.test(raw) ? Number(raw) : null;
}
