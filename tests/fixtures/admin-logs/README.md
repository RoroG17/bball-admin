# Fixtures « admin-logs »

> **RECONSTRUITES, à recapturer sur un back réel.** Aucun back local avec `APP_DEBUG=false` n'était disponible lors de l'étape 8. Ces fichiers sont dérivés de la lecture du code du back (`../backend/app/Http/Controllers/LogController.php`, `app/Http/Middleware/LogApiRequests.php`, `app/Models/ErrorLog.php`, `app/Models/RequestLog.php`, `routes/api.php`) : forme de `paginate()` de Laravel 12 (`current_page`, `data`, `links`, `total`…), `created_at` en ISO 8601 UTC avec 6 décimales (cast `datetime`), entiers castés, `user` joint par `with('user:id,username')`. Date : 12 octobre 2026. SGBD : non déterminé. Données **fictives** (adresse IP de documentation `203.0.113.17`).

| Fichier | Contenu | Statut |
|---|---|---|
| `errors-all.json` | Jeu de 134 erreurs (tableau nu, **pas** une réponse du back) : serveur 401/403/404/422/500, client avec ou sans `context`, utilisateurs présents et `null`, `platform` / `os` renseignés ou `null`, une position. **Sert de magasin au faux back e2e** (pagination et filtres simulés) | reconstruit |
| `requests-all.json` | Jeu de 120 requêtes (idem, `ip_address`, durées) | reconstruit, la route n'existe pas (B-LOG-1) |
| `errors-page-1.json` | `GET /api/logs/errors?per_page=50&page=1` : 50 premières erreurs, `total: 134`, `last_page: 3` | reconstruit |
| `errors-empty.json` | `total: 0`, `data: []`, `last_page: 1` (filtre `source` sans résultat) | reconstruit |
| `errors-out-of-range.json` | `?page=999` : `data: []`, `current_page: 999`, `total: 134` | reconstruit |
| `errors-hostile.json` | **Fabriquée** : message `<script>`, lien `<a href>`, `U+202E`, `U+0007`, 30 000 caractères, nom d'utilisateur HTML, contexte tableau et objet profond | fabriquée |
| `errors-invalid-source.json` | **Fabriquée** : `source: "other"` (format invalide, le bloc doit échouer) | fabriquée |
| `requests-page-1.json` | `GET /api/logs/requests` : **la route n'existe pas** (`routes/api.php`, B-LOG-1) ; reconstruite d'après `LogController::requests` et `RequestLog` | reconstruit, à remplacer par une capture réelle |
| `requests-404.json` | Réponse d'une route absente (`{"message":"The route api/logs/requests could not be found."}`) : corps hypothétique | hypothèse |

Non produites (à capturer) : `errors-user-filter-ignored.json` (preuve que le back ignore `username`, `from`, `status_min` : sert à justifier `LOG_BACK_SUPPORT`) et `invalid-date-400or500.json` (`GET /api/logs/requests?from=abc`, statut réel, B-LOG-3).

À confirmer à la capture : format exact de `created_at` (6 décimales + `Z` attendu), type des entiers (`id` et `user_id` ne sont pas castés), `context` vide (`[]` ou `{}` ?), `platform` en minuscules, statut de `?page=999`, statut d'une date `from` invalide.
