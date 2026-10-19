import { formatDecimal } from "@/lib/format";

export const LOG_MESSAGES = {
  coverage:
    "Cette liste ne montre que les appels qui ont atteint l'API. Ne figurent pas : certaines routes du back (connexion, saisie des statistiques, accueil, mesures physiques) et les pages servies depuis le cache de l'application. Pour les appels de l'application web, l'adresse IP est celle du serveur de l'application, pas celle du joueur. Heures affichées à Paris.",
  ipNote: "Pour les appels de l'application web, c'est l'adresse du serveur de l'application, pas celle du joueur.",
  ipLabel: "Adresse vue par l'API",
  ipMissing: "Non enregistrée",
  detailMissing:
    "Cette entrée n'est plus sur cette page. Elle a pu être supprimée par la purge automatique, ou la liste a changé depuis la dernière lecture.",
  noContext: "Aucun contexte",
  noPosition: "Non renseignée",
  noUser: "Aucun utilisateur identifié, ou compte supprimé",
  noStatus: "Sans statut HTTP",
  durationHint: "Mesurée jusqu'à l'envoi de la réponse",
  parisTime: "Heure de Paris",
  emptyTitle: { errors: "Aucune erreur enregistrée", requests: "Aucune requête enregistrée" },
  emptyPurgeHint: "Une liste vide peut aussi venir d'une purge récente.",
  noMatchTitle: "Aucune entrée ne correspond à ces filtres",
  pageGoneTitle: "Cette page n'existe plus",
  pageGoneText: "La liste a changé depuis la dernière lecture.",
  tableCaption: {
    errors: "Erreurs, de la plus récente à la plus ancienne",
    requests: "Requêtes, de la plus récente à la plus ancienne",
  },
  truncated: (shown: number, total: number) =>
    `Texte tronqué : ${formatDecimal(shown, 0)} caractères affichés sur ${formatDecimal(total, 0)}.`,
} as const;
