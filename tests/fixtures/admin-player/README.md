# Fixtures « admin-player »

> **RECONSTRUITES, à recapturer sur un back réel.** Aucun back local avec `APP_DEBUG=false` n'était disponible lors de l'étape 4. Ces fichiers sont dérivés de la lecture du code du back (`../backend/app/Http/Controllers/JoueurResource.php`, `Participer.php`, `UserResource::index`, `app/Models/Joueur.php`, `User.php`) et des fixtures existantes (`player/joueurs.json`, `player/joueur-*.json`, `admin-team/equipes.json`, `admin-team/users.json`, `home/saisons-admin.json`). Date : 12 octobre 2026. SGBD : non déterminé. Données **fictives**.

Réutilisées telles quelles (non copiées) : `GET /api/joueurs` nominal = `player/joueurs.json` ; `GET /api/joueurs/{licence}` = `player/joueur-complet.json`, `joueur-sans-stats`, `joueur-404` ; `GET /api/equipes` = `admin-team/equipes.json` ; `GET /api/users` = `admin-team/users.json` ; saisons du joueur = `player/saisons-joueur-*.json` ; mesures = `player/physics.json`.

| Fichier | Contenu |
|---|---|
| `joueurs-vide.json` | `{ "joueurs": [] }` |
| `joueurs-ligne-invalide.json` | 3 joueurs dont un sans `date_naissance` (le bloc doit échouer, jamais une liste partielle) |
| `joueurs-equipes.json` | `player/joueurs.json` avec LIC1012 chez TIGER'S (id 2) et LIC1013 / LIC1014 chez Basket Cazères (id 3) : filtre d'équipe |
| `joueur-cree-201.json` | `POST /api/joueurs` : 201 + attributs du modèle `Joueur` (`Id_Equipe`) |
| `creation-422-licence.json` | licence déjà prise (`unique:joueurs,licence`) ; phrase Laravel anglaise |
| `creation-422-vide.json` | corps vide : toutes les clés `required` |
| `creation-422-equipe.json` | **Hypothèse** : le back n'a pas de `exists` sur `equipe` (B-P3) ; forme attendue quand il sera livré |
| `creation-500.json` | **Hypothèse** : 500 générique (licence de 9 caractères ou équipe inexistante : erreur SQL, jamais observée) |
| `update-200.json` | `PUT` : 200 + `Joueur::getJoueur` |
| `update-404.json` | `{ "message": "Joueur non trouvé" }` |
| `delete-200.json` | `DELETE` : 200 `{ "message": "Joueur supprimé" }` |
| `delete-500-stats.json` | **Hypothèse** : 500 générique (FK `jouer` sans cascade, B-ADM-1) ; non produit avant B-ADM-1 (B-ADM-5) |
| `participer-201.json` | `POST /api/participer` : 201 `{ "message": "Participation ajoutée" }` |
| `participer-422.json` | saison inexistante (`exists:saisons`) |
| `users-has-password-chaine.json` | `GET /api/users` avec `has_password` en chaîne (`"0"` / `"1"`) : forme possible selon le pilote |

À confirmer à la capture : forme de `Id_Equipe` et de `has_password`, `username` créé pour un nom avec accent ou espace (le code fait `prenom.nom` sans transformation), nom rogné ou non par le back, statut d'une licence de 9 caractères (500 présumé, B-P3), statut d'un `DELETE` bloqué par `jouer`.
