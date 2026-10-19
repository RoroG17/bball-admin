export const LOGIN_REASONS = ["expired", "password-set", "activation-expired", "already-active"] as const;

export type LoginReason = (typeof LOGIN_REASONS)[number];

export const LOGIN_REASON_MESSAGES: Record<LoginReason, string> = {
  expired: "Ta session a expiré. Reconnecte-toi pour continuer.",
  "password-set": "Mot de passe défini. Connecte-toi.",
  "activation-expired": "Le délai pour créer ton mot de passe est dépassé. Saisis de nouveau ton identifiant.",
  "already-active": "Ce compte n'est pas à activer. Connecte-toi avec ton mot de passe.",
};
