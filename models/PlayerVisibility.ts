/** Ce que le lecteur peut voir sur une fiche joueur (Q1). Un bloc non visible n'est ni chargé ni rendu. */
export type PlayerVisibility = {
  /** Onglet Statistiques, synthèse « dernier match ». */
  matchStats: boolean;
  /** Date de naissance, civilité. */
  personalInfo: boolean;
  /** Onglet Examens, compteur d'examens. */
  exams: boolean;
  /** Onglet Physique, synthèse physique. */
  physical: boolean;
  /** Modifier le joueur, Créer un examen, Ajouter une mesure, mesures non reconnues. */
  adminActions: boolean;
};
