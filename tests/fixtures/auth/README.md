# Fixtures « auth »

Réponses de `POST /connect` et `POST /update` (`routes/web.php`, `UserController`), capturées le 11 octobre 2026 sur le back local (PostgreSQL). Corps seul dans le fichier, statut dans le nom.

| Fichier | Source | Dérivation |
|---|---|---|
| `connect-404.json` | `POST /connect {"username":"inconnu.personne"}` | — |
| `connect-422.json` | `POST /connect {}` | — |
| `connect-400.json` | `POST /connect {"username":"admin"}` (compte avec mot de passe, sans mot de passe envoyé) | — |
| `connect-401.json` | `POST /connect {"username":"admin","password":"mauvais"}` | — |
| `connect-201.json` | `POST /connect` sur un compte joueur sans mot de passe | Même réponse avec ou sans mot de passe envoyé. |
| `connect-200-admin.json` | **dérivé du code** (`UserController::connect`) | Le mot de passe du compte `admin` local n'est pas `admin` : aucun 200 réel capturé. Clés et types repris du contrôleur, jeton fictif. |
| `connect-200-joueur.json` | **dérivé du code** | Identifiant, licence et équipe fictifs (données de mineurs). |
| `connect-200-sans-token.json` | **inventé** | Format invalide : `token` absent. |
| `connect-200-access-token.json` | **inventé** | Format invalide : ancien nom `access_token` (toléré par la V1, refusé en V2). |
| `update-404.json` | `POST /update {"username":"inconnu.personne","password":"abcdefgh"}` | — |
| `update-422.json` | `POST /update {"username":"inconnu.personne"}` | — |
| `update-200.json` | **dérivé du code** | Le `POST /update` réel n'a **pas** été appelé sur un compte existant, pour ne pas écrire dans la base locale. Le corps est ignoré par le front. |
