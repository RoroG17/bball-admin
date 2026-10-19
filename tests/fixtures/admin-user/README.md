# Fixtures « admin-user »

> **RECONSTRUITES, à recapturer sur un back réel.** Aucun back local avec `APP_DEBUG=false` n'était disponible lors de l'étape 7. Ces fichiers sont dérivés de la lecture du code du back (`../backend/app/Http/Controllers/UserResource.php`, `app/Models/User.php` — `createUser`, `$hidden` —, `routes/api.php`) et des fixtures existantes (`admin-team/users.json`, `player/joueurs.json`). Date : 12 octobre 2026. SGBD : non déterminé (B-U4). Données **fictives**.

Réutilisée telle quelle (non copiée) : la liste des joueurs du sélecteur = `player/joueurs.json` (`GET /api/joueurs`).

| Fichier | Contenu |
|---|---|
| `users-200.json` | `GET /api/users` : compte `admin` (joueur, nom, prénom, équipe `null`), joueurs rattachés avec équipe, **joueur sans équipe** (`sans.equipe`, `equipe: null`), compte sans joueur, mots de passe définis (`1`) et non définis (`0`) |
| `users-200-string-flags.json` | Même forme avec `has_password` en chaînes `"0"` / `"1"` : **synthétique** (le SQL `CASE … 0 ELSE 1` renvoie un entier ; une chaîne reste possible selon le pilote, D-U7) |
| `users-200-empty.json` | `{ "users": [] }` |
| `users-200-invalid-flag.json` | **Synthétique** : `has_password: 2` (le bloc doit échouer, jamais « défini ») |
| `users-200-invalid-shape.json` | **Synthétique** : `users` n'est pas un tableau |
| `users-200-historiques.json` | **Synthétique** : comptes historiques — `Jean Pierre.Martin` (créé par `JoueurResource::store` avec un espace), `Admin ` (identifiant ambigu) |
| `user-create-201.json` | `POST /api/users` : 201 + le `User` créé (`password` et `remember_token` masqués par `$hidden`), `joueur: null` (B6 : le back ne lit pas `joueur`) |
| `user-create-201-linked.json` | **Hypothèse B6** : même réponse avec `joueur` renseigné, pour le jour où le back enregistrera le lien |
| `user-create-422-taken.json` | `unique:users,username` — phrase Laravel anglaise (`APP_LOCALE=en`) |
| `user-create-422-required.json` | `required` sur `username` |
| `user-reset-200.json` / `user-reset-404.json` | `PUT /api/users/{username}` : `{ "message": "Mot de passe réinitialisé" }` / `{ "message": "Utilisateur non trouvé" }` |
| `user-delete-200.json` / `user-delete-404.json` | `DELETE /api/users/{username}` : `{ "message": "Utilisateur supprimé" }` / 404 identique à la réinitialisation |

À confirmer à la capture : type réel de `has_password` (entier ou chaîne), moteur et collation de `users.username` (alias `ADMIN` → `admin` sous MySQL `unicode_ci`), clés exactes du `User` renvoyé par `POST`, comportement de `PUT`/`DELETE` avec un identifiant contenant un espace ou un point.
