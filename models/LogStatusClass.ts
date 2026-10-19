export type LogStatusClass = "success" | "redirect" | "clientError" | "serverError" | "none";

export const LOG_STATUS_CLASS_LABELS: Record<LogStatusClass, string> = {
  success: "Succès",
  redirect: "Redirection",
  clientError: "Erreur client",
  serverError: "Erreur serveur",
  none: "Sans statut",
};
