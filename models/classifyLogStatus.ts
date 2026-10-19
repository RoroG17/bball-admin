import type { LogStatusClass } from "@/models/LogStatusClass";

/** Classe d'un code HTTP. `null`, 1xx et tout code hors 200-599 : `none`. */
export function classifyLogStatus(code: number | null): LogStatusClass {
  if (code === null || !Number.isInteger(code)) return "none";
  if (code >= 200 && code <= 299) return "success";
  if (code >= 300 && code <= 399) return "redirect";
  if (code >= 400 && code <= 499) return "clientError";
  if (code >= 500 && code <= 599) return "serverError";
  return "none";
}
