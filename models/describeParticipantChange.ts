import type { ParticipantOutcome } from "@/models/ParticipantAction";

/** Phrase annoncée après un clic (sans accord de genre). Le nom vient du serveur (props du bouton), pas de l'action. */
export function describeParticipantChange(outcome: ParticipantOutcome, playerName: string): string {
  switch (outcome) {
    case "added":
      return `Inscription enregistrée : ${playerName}.`;
    case "removed":
      return `Retrait enregistré : ${playerName}.`;
    case "unchanged":
      return `Déjà inscrit : ${playerName}. Rien n'a été modifié.`;
  }
}
