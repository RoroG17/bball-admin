/** Textes des équipes (formulaires, impact, usage). Aucune phrase du back n'est jamais affichée. */
export const TEAM_MESSAGES = {
  nameRequired: "Le nom de l'équipe est obligatoire.",
  nameTooLong: "Le nom ne peut pas dépasser 255 caractères.",
  nameTaken: (existingName: string) => `Une équipe porte déjà ce nom (« ${existingName} »).`,
  logoInvalid:
    "Le logo doit être un nom de fichier simple, sans dossier ni adresse (exemple : logo_colomiers.png).",
  logoTooLong: "Le nom du fichier ne peut pas dépasser 255 caractères.",
  logoCannotBeCleared:
    "Le serveur ne permet pas encore de retirer un logo. Garde le fichier actuel ou remplace-le par un autre.",
  duplicateCheckUnavailable: "Impossible de vérifier si cette équipe existe déjà. Réessaie dans un instant.",
  usageUnavailable: "Les indicateurs d'usage sont momentanément indisponibles.",
  clubWarning: "Cette équipe est l'équipe du club sur au moins une saison.",
  deleteWarning:
    "Cette suppression est définitive. Elle supprime aussi les joueurs de l'équipe et leurs comptes, ses saisons, et tous les matchs où elle apparaît (à domicile, à l'extérieur ou en tant qu'équipe de la saison), avec leurs statistiques.",
} as const;
