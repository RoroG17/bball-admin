import { sanitizeUntrustedText } from "@/models/sanitizeUntrustedText";

const PLATFORM_LABELS: Record<string, string> = { web: "Web", mobile: "Mobile" };

/** « Web », « Mobile · Android 14 », une valeur inconnue assainie telle quelle, ou « — » si rien n'est renseigné. */
export function describeLogPlatform(platform: string | null, os: string | null): string {
  const platformLabel = platform === null ? null : (PLATFORM_LABELS[platform] ?? sanitizeUntrustedText(platform));
  const osLabel = os === null ? null : sanitizeUntrustedText(os);
  return [platformLabel, osLabel].filter((part) => part !== null && part !== "").join(" · ") || "—";
}
