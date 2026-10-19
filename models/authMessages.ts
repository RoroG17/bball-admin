/** Source unique des messages d'authentification (tutoiement, D11). */
export const AUTH_MESSAGES = {
  invalidCredentials: "Identifiant ou mot de passe incorrect.",
  unavailable: "Le service est momentanément indisponible. Vérifie ta connexion puis réessaie.",
  tooManyAttempts: "Trop de tentatives. Patiente quelques minutes avant de réessayer.",
  invalidInput: "Saisis ton identifiant.",
  initPasswordFailed: "Le mot de passe n'a pas été accepté. Choisis-en un autre.",
  initPasswordUnavailable: "Impossible de définir le mot de passe pour le moment. Réessaie dans un instant.",
} as const;
