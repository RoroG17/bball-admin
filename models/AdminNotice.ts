/** `reset` : réservé à `admin-user` (mot de passe réinitialisé). */
export const ADMIN_NOTICE_CODES = ["created", "updated", "deleted", "reset"] as const;
export type AdminNoticeCode = (typeof ADMIN_NOTICE_CODES)[number];

export type AdminNotice = { code: AdminNoticeCode; ref: string | null };

/** Longueur maximale de la `ref` lue dans l'URL. */
export const ADMIN_NOTICE_REF_MAX_LENGTH = 64;
