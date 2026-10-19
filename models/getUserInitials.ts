/** Initiales d'un nom d'utilisateur : `"jean.dupont"` → `"JD"`, `"admin"` → `"AD"`. */
export function getUserInitials(username: string): string {
  const parts = username.trim().split(/[\s._-]+/).filter((part) => part !== "");
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("fr-FR");
  return (parts[0].charAt(0) + parts[1].charAt(0)).toLocaleUpperCase("fr-FR");
}
