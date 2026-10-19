export type ParticipantOutcome = "added" | "removed" | "unchanged";

/** Résultat d'un ajout ou d'un retrait de participant (appel direct de l'action, sans formulaire). */
export type ParticipantActionResult =
  | { status: "success"; outcome: ParticipantOutcome }
  | { status: "error"; message: string };

export type ParticipantIntent = "add" | "remove";
