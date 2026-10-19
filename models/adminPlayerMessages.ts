/** Textes des joueurs (formulaires, comptes, inscription). Aucune phrase du back n'est jamais affichée. */
export const ADMIN_PLAYER_MESSAGES = {
  licenceRequired: "La licence est obligatoire.",
  licenceInvalid: "La licence doit contenir de 1 à 8 lettres ou chiffres, sans espace ni caractère spécial.",
  licenceTaken: "Cette licence est déjà utilisée.",
  lastNameRequired: "Le nom est obligatoire.",
  lastNameTooLong: "Le nom est trop long (255 caractères maximum).",
  firstNameRequired: "Le prénom est obligatoire.",
  firstNameTooLong: "Le prénom est trop long (255 caractères maximum).",
  civilityRequired: "Choisis une civilité.",
  birthDateInvalid: "Saisis une date de naissance valide.",
  birthDateFuture: "La date de naissance ne peut pas être dans le futur.",
  birthDateTooOld: "La date de naissance est trop ancienne (avant 1930).",
  teamRequired: "Choisis une équipe.",
  teamUnknown: "Cette équipe n'existe pas ou n'est plus disponible.",
  teamGone: "Cette équipe n'existe plus.",
  photoInvalid: "Le nom de fichier doit se terminer par .png, .jpg, .jpeg, .webp ou .gif et ne pas contenir de « / ».",
  playerGone: "Ce joueur n'existe plus.",
  seasonGone: "Cette saison n'existe plus.",
  createMaybePartial:
    "Le serveur a signalé une erreur. Le joueur a peut-être été créé sans son compte de connexion : vérifie la liste avant de réessayer.",
  enrollmentUnavailable: "Impossible de vérifier les inscriptions du joueur. Réessaie dans un instant.",
  deleteWarning:
    "Cette suppression est définitive. Elle supprime aussi le compte de connexion du joueur, ses inscriptions, ses statistiques de match, ses examens et ses mesures.",
  teamHint: "La liste contient aussi les équipes adverses : choisis l'équipe du joueur au club.",
  licenceHint: "8 caractères maximum : lettres et chiffres.",
  licenceReadOnlyHint: "Identifiant fédéral, non modifiable.",
  photoHint:
    "Exemple : aubert.png. Laisse vide pour ne pas afficher de photo (en modification, vider le champ retire la photo actuelle). Le fichier doit déjà être sur le serveur.",
  civilityUnknown: (raw: string) => `La valeur actuelle (« ${raw} ») n'est pas reconnue : choisis une civilité.`,
  accountWarning: (username: string) =>
    `Le compte de connexion de ce joueur (identifiant « ${username} ») ne suit pas les changements de nom ou de prénom.`,
  accountWarningNone: "Aucun compte de connexion n'est lié à ce joueur.",
  accountMissing:
    "Aucun compte de connexion n'a été trouvé pour ce joueur : il ne pourra pas se connecter. Préviens le responsable technique.",
  accountHint: "Transmets cet identifiant au joueur. À sa première connexion, il choisira son mot de passe.",
  accountActivated: "Ce compte a déjà un mot de passe.",
  enrollmentExplain:
    "Ce joueur n'est inscrit à aucune saison : il n'apparaît pas dans les effectifs ni dans la saisie des statistiques.",
  noSeason: "Aucune saison n'existe encore : crée une saison pour y inscrire le joueur.",
  noTeamTitle: "Aucune équipe enregistrée",
  noTeamText: "Crée d'abord une équipe pour pouvoir y rattacher un joueur.",
  emptyNoneTitle: "Aucun joueur enregistré",
  emptyNoneText: "Crée le premier joueur pour qu'il apparaisse dans les effectifs.",
  emptyNoMatchTitle: "Aucun joueur ne correspond à ta recherche.",
} as const;
