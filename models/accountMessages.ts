export const ACCOUNT_MESSAGES = {
  username: {
    required: "Saisis un identifiant.",
    tooLong: "L'identifiant fait 64 caractères au maximum.",
    badCharacters: "Utilise uniquement des lettres, des chiffres, le point, le tiret et le tiret bas, sans espace.",
    reserved: "Cet identifiant est réservé. Choisis-en un autre.",
    taken: "Cet identifiant est déjà utilisé.",
  },
  playerUnavailable:
    "Ce joueur n'existe plus ou a déjà un compte. Choisis un autre joueur ou crée le compte sans joueur.",
  gone: "Ce compte n'existe plus. La liste a été actualisée.",
  protection: {
    self: "Tu ne peux pas réinitialiser ni supprimer ton propre compte.",
    admin:
      "Le compte administrateur ne peut être ni réinitialisé ni supprimé depuis cet écran : sans lui, plus personne ne pourrait gérer le club.",
  },
  targetUnreadable: "Impossible de vérifier ce compte pour le moment. Rien n'a été modifié. Réessaie.",
  status: { set: "Défini", unset: "Non défini" },
  badge: { admin: "Administrateur", unlinked: "Non rattaché", ambiguous: "Identifiant ambigu" },
  protected: "Compte protégé",
  noPlayer: "Aucun joueur",
  unlinkedWarning: "Ce compte n'est rattaché à aucun joueur : il ne donnera accès à aucune saison.",
  linkNotSavedWarning:
    "Pour l'instant, le serveur n'enregistre pas le lien avec le joueur : le compte sera créé sans joueur rattaché. Vérifie-le dans la liste.",
  noPlayerHint: "Sans joueur choisi, le compte ne sera rattaché à personne.",
  noTeamHint: "Un joueur sans équipe n'apparaît pas dans cette liste.",
  playerNotAvailable: "Ce joueur n'est pas disponible : il a déjà un compte ou n'existe plus.",
  emptyNoneTitle: "Aucun compte",
  emptyNoneText: "Les comptes des joueurs sont créés avec les joueurs. Tu peux aussi en créer un à la main.",
  emptyNoMatchTitle: "Aucun compte ne correspond à ta recherche.",
  allPlayersHaveAccount: "Tous les joueurs ont déjà un compte.",
  noPlayerMatch: (query: string) => `Aucun joueur ne correspond à « ${query} ».`,
  pickerTruncated: (shown: number, total: number) => `${shown} sur ${total} joueurs : affine la recherche.`,
  resetWarning: "Le mot de passe actuel sera effacé immédiatement.",
  deleteWarning: "Cette suppression est définitive.",
} as const;
