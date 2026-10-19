"use client";

import { createContext, useContext } from "react";
import type { ParticipantActionResult } from "@/models/ParticipantAction";

export type ParticipantFeedbackValue = {
  /** Annonce le résultat d'un clic ; le nom du joueur vient des props du bouton (serveur). */
  report: (result: ParticipantActionResult, playerName: string) => void;
  /** Vide la zone d'annonce (à chaque nouvelle action). */
  clear: () => void;
};

/** Canal entre les boutons Inscrire / Retirer et la zone d'annonce `ParticipantsFeedback`. */
export const ParticipantFeedbackContext = createContext<ParticipantFeedbackValue | null>(null);

export function useParticipantFeedback(): ParticipantFeedbackValue | null {
  return useContext(ParticipantFeedbackContext);
}
