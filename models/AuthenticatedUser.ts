/** Identité renvoyée par le back à la connexion (nom canonique du back, pas celui tapé). */
export type AuthenticatedUser = {
  username: string;
  licence: string | null;
};
