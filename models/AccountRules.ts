import { ADMIN_USERNAME } from "@/models/resolveUserRole";

/** Aligné sur la troncature de `ref` à 64 caractères de `parseAdminNotice`. */
export const USERNAME_MAX_LENGTH = 64;
/** Lettres, chiffres, point, tiret et tiret bas ; aucun espace ni caractère de contrôle ou de largeur nulle. */
export const USERNAME_PATTERN = /^[\p{L}\p{N}._-]+$/u;
export const RESERVED_USERNAMES: readonly string[] = [ADMIN_USERNAME];
export const PLAYER_PICKER_LIMIT = 50;
/** `POST /api/users` n'enregistre pas `joueur` (B6). À passer à `true` quand B6 est livré et vérifié. */
export const LINK_ON_CREATE_SUPPORTED = false;
