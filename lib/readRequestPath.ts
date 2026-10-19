import "server-only";
import { headers } from "next/headers";
import { REQUEST_PATH_HEADER } from "@/lib/requestPathHeader";
import { sanitizeRedirectPath } from "@/models/sanitizeRedirectPath";

/** Chemin de la page en cours, re-assaini à la lecture. `/` si l'en-tête est absent. */
export async function readRequestPath(): Promise<string> {
  return sanitizeRedirectPath((await headers()).get(REQUEST_PATH_HEADER));
}
