import type { Session } from "@/models/Session";

/** `false` = « compte sans joueur » : un joueur sans licence n'a accès à aucune saison (D7). */
export function hasLinkedPlayer(session: Pick<Session, "role" | "licence">): boolean {
  return session.role === "admin" || session.licence !== null;
}
