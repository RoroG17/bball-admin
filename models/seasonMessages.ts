/** Textes de l'écran des saisons (formulaires, participants, impact). Aucune phrase du back n'est jamais affichée. */
export const SEASON_MESSAGES = {
  startYearRequired: "Renseigne l'année de début (4 chiffres).",
  endYearRequired: "Renseigne l'année de fin (4 chiffres).",
  yearRange: "Choisis une année entre 2000 et 2100.",
  yearOrder: "L'année de fin doit être l'année de début ou la suivante.",
  championshipRequired: "Renseigne le championnat.",
  championshipTooLong: "Le championnat est trop long (255 caractères maximum).",
  categoryRequired: "Renseigne la catégorie.",
  categoryTooLong: "La catégorie est trop longue (255 caractères maximum).",
  teamRequired: "Choisis l'équipe RPB de la saison.",
  duplicate:
    "Une saison identique existe déjà (mêmes années, championnat, catégorie et équipe). Retrouve-la dans la liste.",
  teamGone: "Cette équipe n'existe plus. Choisis-en une autre.",
  teamsUnavailable:
    "La liste des équipes est indisponible : l'équipe n'a pas pu être vérifiée. Réessaie dans un instant.",
  seasonGone: "Cette saison n'existe plus. Elle a peut-être été supprimée entre-temps.",
  participantGone: "Ce joueur ou cette saison n'existe plus. Recharge la page.",
  teamsNamesUnavailable: "Les noms des équipes n'ont pas pu être chargés : l'équipe est indiquée par son numéro.",
  noTeamWarning:
    "Cette saison n'a pas d'équipe RPB : le bilan victoires / défaites ne peut pas être calculé. Choisis l'équipe pour corriger.",
  participantsAutosave:
    "Les ajouts et retraits de joueurs sont enregistrés immédiatement. Le bouton « Annuler » du formulaire ci-dessus ne les concerne pas.",
  deleteWarning:
    "Cette suppression est définitive. Elle supprime aussi tous les matchs de la saison avec leurs statistiques, et les inscriptions des joueurs.",
  teamPlaceholder: "Choisis l'équipe…",
  teamFieldHint:
    "Les équipes déjà utilisées par une saison sont proposées en premier. Choisis l'équipe du club, pas un adversaire.",
  participantsEmpty: "Aucun joueur inscrit sur cette saison.",
  participantsEmptyHint: "Ajoute des joueurs avec la recherche ci-dessous.",
  noPlayerAtAll: "Aucun joueur n'existe encore.",
  allEnrolled: "Tous les joueurs sont déjà inscrits sur cette saison.",
  noCandidateMatch: (query: string) => `Aucun joueur non inscrit ne correspond à « ${query} ».`,
  truncated: (shown: number, total: number) => `${shown} premiers résultats sur ${total} : précise la recherche.`,
  emptyListTitle: "Aucune saison",
  emptyListText: "Crée la première saison pour y rattacher des matchs et des joueurs.",
  noMatchTitle: (query: string) => `Aucune saison ne correspond à « ${query} »`,
  teamNone: "Équipe RPB non renseignée",
  teamUnknown: (id: number) => `Équipe n° ${id} introuvable`,
  teamUnavailable: (id: number) => `Équipe n° ${id}`,
  recencyBadge: "Plus récente",
  recencyBadgeTitle: "Saison la plus récente : affichée par défaut dans l'application",
} as const;
