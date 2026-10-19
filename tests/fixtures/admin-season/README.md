# Fixtures « admin-season »

> **RECONSTRUITES, à recapturer sur un back réel.** Aucun back local avec `APP_DEBUG=false` n'était disponible lors de l'étape 5. Ces fichiers sont dérivés de la lecture du code du back (`../backend/app/Http/Controllers/SaisonResource.php`, `Participer.php`, `app/Models/Saison.php`, migrations `saisons`, `participer`) et des fixtures existantes. Date : 12 octobre 2026. SGBD : non déterminé. Données **fictives**.

Réutilisées telles quelles (non copiées) : `GET /api/equipes` = `admin-team/equipes.json` ; `GET /api/joueurs` = `player/joueurs.json` (homonymes et accents : « Élodie ») ; `GET /api/matchs` = `calendar/matchs*.json` ; `GET /api/matchs/{id}` = `game-detail/match-joue*.json` et `match-sans-stats.json` (comptage des lignes de stats) ; saisons du faux back par défaut = `home/saisons-admin.json`.

| Fichier | Contenu |
|---|---|
| `seasons-list-200.json` | `GET /api/saisons` : cinq saisons dont deux de même `annee_debut` (4 et 6), une sans équipe (`equipe: null`, id 5), une dont les nombres sont des chaînes (id `"3"`, cas SGBD) |
| `seasons-list-empty-200.json` | `[]` |
| `season-show-200.json` | `GET /api/saisons/{id}` : `{ saison, participer }` avec un **doublon** de licence (`join` sans `DISTINCT`) |
| `season-show-no-participants-200.json` | `participer: []` |
| `season-show-team-null-200.json` | `saison.equipe: null` |
| `season-show-404.json` | `{ "message": "Saison non trouvée" }` |
| `season-create-201.json` | `POST /api/saisons` : 201 + modèle avec `Id_Saison` |
| `season-update-200.json` | `PUT /api/saisons/{id}` : 200 + modèle |
| `season-422-required.json` | corps vide : les cinq clés `required` (phrases Laravel anglaises, jamais affichées) |
| `season-422-integer.json` | années non entières |
| `season-team-fk-500.json` | **Hypothèse** : `equipe` inexistante = violation de FK = 500 générique (jamais observé, B-SAI-5) |
| `season-delete-200.json` / `season-delete-404.json` | `DELETE` d'une saison ; id inexistant |
| `season-delete-500-stats.json` | **Hypothèse** : 500 générique (FK `jouer.Id_Match` sans cascade, B-SAI-1 / B-ADM-1) ; non produit avant B-ADM-1 (B-ADM-5) |
| `participer-post-201.json` | `POST /api/participer` : 201 `{ "message": "Participation ajoutée" }` |
| `participer-post-422-exists.json` | saison ou licence inexistante (`exists`), clés `Id_Saison` / `licence` |
| `participer-delete-200.json` | `DELETE /api/participer` : 200, y compris pour un couple absent |

À confirmer à la capture : forme de `Id_Saison` / `equipe` (nombre ou chaîne), statut d'une `equipe` inexistante (500 présumé), statut d'un `DELETE` de saison bloqué par `jouer`, `GET /api/saisons/abc`, doublons réels dans `participer`.
