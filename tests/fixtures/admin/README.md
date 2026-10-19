# Fixtures « admin » (socle des écritures)

> **RECONSTRUITES, à recapturer sur un back réel.** Aucun back local avec `APP_DEBUG=false` n'était disponible lors de l'étape 3 : ces fichiers ont été écrits à partir de la lecture du code du back (`../backend/app/Http/Controllers/*Resource.php`, `Participer.php`, `routes/api.php`) et des phrases par défaut de Laravel 11 (en anglais, `APP_LOCALE=en`). Aucun n'a été capturé. Date de reconstruction : 12 octobre 2026. SGBD : non déterminé.

| Fichier | Statut | Origine |
|---|---|---|
| `validation-422-unique.json` | 422 | Phrase Laravel `unique` ; **le back n'a pas de règle `unique` sur `licence`** dans le code lu : forme valide, déclencheur non confirmé |
| `validation-422-required.json` | 422 | `POST /api/equipes` sans `nom` (`'nom' => 'required\|string'`) |
| `validation-422-exists.json` | 422 | Phrase Laravel `exists` ; déclencheur non confirmé |
| `validation-422-max.json` | 422 | **Hypothétique** : le back n'a pas de `max` (un nom de 300 caractères donnerait un 500, B-T4). Forme attendue quand B-ADM-4 sera livré |
| `not-found-404.json` | 404 | `JoueurResource` : `{ "message": "Joueur non trouvé" }` |
| `not-found-match-ref-404.json` | 404 | `MatchResource::store` : `{ "message": "L'équipe n'existe pas" }` |
| `delete-200.json` | 200 | `JoueurResource::destroy` (jamais 204) |
| `participer-delete-200.json` | 200 | `Participer::destroy` |
| `server-error-500.json` | 500 | Corps générique de Laravel avec `APP_DEBUG=false` ; un `DELETE` bloqué par la FK `jouer` n'est **pas** capturable avant B-ADM-1 (B-ADM-5) |
| `empty-200.txt` | 200 | Réponse 2xx sans corps : aucune route lue n'en renvoie, fichier vide à titre de cas limite |
