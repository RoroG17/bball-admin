/** Licence saisie : espaces retirés (internes compris) et majuscules (D-P7). Ne valide pas. */
export function normalizePlayerLicence(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}
