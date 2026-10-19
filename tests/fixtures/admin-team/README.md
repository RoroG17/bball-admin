# Fixtures « admin-team »

> **RECONSTRUITES, à recapturer sur un back réel.** Aucun back local avec `APP_DEBUG=false` n'était disponible lors de l'étape 3. Ces fichiers sont dérivés de la lecture de `../backend/app/Http/Controllers/EquipeResource.php`, `app/Models/Equipe.php`, `UserResource::index`, `routes/api.php` et des fixtures existantes (`home/equipe.json`, `calendar/matchs.e2e.json`, `player/joueurs.json`) pour que les noms de logos et d'équipes soient cohérents. Date : 12 octobre 2026. SGBD : non déterminé. Données **fictives**.

À confirmer lors de la capture réelle (voir `doc/implementation/admin-team.md`) : forme de `Id_Equipe` (entier ici, `numeric` accepte aussi une chaîne), statut de `GET /api/equipes/abc` (PostgreSQL : 500 présumé ; MySQL : 404), 422 ou 500 pour un nom de 300 caractères, statut et corps d'un `DELETE` bloqué par `jouer` (B-ADM-1), forme réelle de `GET /api/users`.

| Fichier | Contenu |
|---|---|
| `equipes.json` | `GET /api/equipes` : 16 équipes (tableau nu, sans tri), dont `FAC Basket` (équipe du club, saisons 1 et 4), `AS Labarthe-sur-Lèze` et `Étoile Cugnaux` sans logo, `Basket Inconnu` dont le fichier `inconnu.png` n'existe pas, `Étoile Cugnaux` sans joueur ni match |
| `equipes-vide.json` | `[]` |
| `equipe-detail.json`, `equipe-detail-sans-logo.json` | `GET /api/equipes/{id}` : objet nu |
| `equipe-404.json` | `{ "message": "Équipe non trouvée" }` (`EquipeResource::show`) |
| `equipe-created-201.json` | `POST` : 201 + `{ nom, logo, Id_Equipe }` (`createEquipe`) |
| `equipe-updated-200.json` | `PUT` : 200 + l'équipe |
| `equipe-deleted-200.json` | `DELETE` : 200 `{ "message": "Équipe supprimée" }` |
| `equipe-422-required.json` | `POST` sans `nom` |
| `equipe-nom-300.json` | **Hypothèse** : 500 générique (aucun `max` côté back, B-T4) |
| `equipe-delete-500-stats.json` | **Hypothèse** : 500 générique (FK `jouer` sans cascade, B-ADM-1) |
| `equipe-id-non-numerique.json` | **Hypothèse** PostgreSQL : 500 générique (B-T7) |
| `users.json` | `GET /api/users` : `{ users: [{ username, joueur, nom, prenom, equipe, has_password }] }`, un compte `admin` sans joueur, un `has_password: 0` |
