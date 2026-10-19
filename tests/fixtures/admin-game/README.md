# Fixtures « admin-game »

> **RECONSTRUITES, à recapturer sur un back réel.** Aucun back local avec `APP_DEBUG=false` n'était disponible lors de l'étape 6. Ces fichiers sont dérivés de la lecture du code du back (`../backend/app/Http/Controllers/MatchResource.php`, `app/Models/Matchs.php`, migration `matchs`, route `GET /api/matchs/review`) et des fixtures existantes. Date : 12 octobre 2026. SGBD : non déterminé. Données **fictives**.

Réutilisées telles quelles (non copiées) : `GET /api/matchs` = `calendar/matchs.e2e.json` (18 matchs de la saison 4, 14 de la saison 1) ; `GET /api/matchs/{id}` = `game-detail/match-sans-stats.json` et `match-joue.json` (10 lignes de stats) ; `GET /api/equipes` = `admin-team/equipes.json` ; `GET /api/saisons` = `home/saisons-admin.json`.

| Fichier | Contenu |
|---|---|
| `match-created-201.json` | `POST /api/matchs` : 201 + modèle (clé primaire `Id_Match`, scores 0 et `video: null` forcés par `Matchs::createMatch`) |
| `match-updated-200.json` | `PUT /api/matchs/{id}` : 200 + modèle |
| `match-delete-200.json` | `DELETE` : `{ "message": "Match supprimé" }` |
| `match-404.json` / `match-404-equipe.json` / `match-404-saison.json` | Les trois 404 d'écriture (phrases françaises de `MatchResource` : « Match non trouvé », « L'équipe n'existe pas », « La saison n'existe pas »), classés par `classifyGameNotFound` |
| `match-422-required.json` | `POST` à corps vide : cinq clés `required` (phrases Laravel anglaises, jamais affichées) |
| `match-422-date.json` | `date_match` invalide |
| `match-delete-500-stats.json` | **Hypothèse** : 500 générique (FK `jouer.Id_Match` sans cascade, B-ADM-1) ; non produit avant B-ADM-1 (B-ADM-5, B-G5) |
| `matchs-review.json` | `GET /api/matchs/review` : matchs joués sans ligne `jouer` (avec `video`) |
| `matchs-review-vide.json` | `[]` |
| `matchs-review-invalide.json` | Corps inattendu (objet au lieu d'un tableau) : l'indicateur passe en « Non vérifié » |

**Non reconstruit** : la séquence `PUT video: ""` puis `GET` (preuve que la vidéo n'est pas effacée, justifie D-G5) : le code du back (`$data['video'] ?? $this->video`) la garantit, à confirmer sur un back réel.

À confirmer à la capture : forme de `dateMatch` (`YYYY-MM-DD` ou avec heure), forme de `Id_Match` (nombre ou chaîne), statut et corps d'un `DELETE` bloqué par `jouer`, statut d'un `GET /api/matchs/abc`, phrases exactes des 404 (`classifyGameNotFound`).
