export const PASSWORD_MIN_LENGTH = 8;

/** Limite de bcrypt (cast `hashed` de Laravel) : au-delà, le surplus serait ignoré en silence. */
export const PASSWORD_MAX_BYTES = 72;

/** Affichée avant la saisie (DS83 : la règle « différent de l'identifiant » est annoncée). */
export const PASSWORD_RULE_TEXT = "8 caractères minimum, 72 maximum. Il doit être différent de ton identifiant.";
