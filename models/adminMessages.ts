import type { BackMessageKind } from "@/models/classifyBackMessage";

/** Seules phrases d'erreur d'écriture affichées : aucun message du back n'est jamais montré tel quel. */
export const ADMIN_MESSAGES = {
  forbidden: "Action réservée aux administrateurs.",
  fixFields: "Corrige les champs signalés.",
  rejected: "Le serveur a refusé certaines données. Vérifie le formulaire puis réessaie.",
  gone: "Cet élément n'existe plus. Il a peut-être été supprimé entre-temps.",
  conflict: "Cette opération entre en conflit avec des données existantes.",
  networkWrite: "Le serveur n'a pas répondu. Vérifie dans la liste si l'opération a été enregistrée avant de réessayer.",
  serverWrite: "Le serveur a refusé l'opération. Réessaie ; si le problème persiste, préviens le responsable technique.",
  deleteFailed:
    "La suppression a échoué et rien n'a été supprimé de façon certaine. Vérifie la liste, puis réessaie ou préviens le responsable technique.",
  impactUnavailable: "Impossible de calculer ce qui sera supprimé. Par sécurité, la suppression est désactivée.",
} as const;

export const BACK_KIND_MESSAGES: Record<BackMessageKind, string> = {
  taken: "Cette valeur est déjà utilisée.",
  required: "Ce champ est obligatoire.",
  tooLong: "Cette valeur est trop longue.",
  unknownReference: "Cette valeur n'existe pas ou n'est plus disponible.",
  invalid: "Cette valeur est refusée par le serveur.",
};
