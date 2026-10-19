# Fixtures du palmarès (`GET /api/history`)

> ⚠️ **Fixtures synthétiques**, écrites d'après le contrat lu dans le back (`HistoryController.php`, `Jouer.php`), **pas capturées** sur un back en marche. Joueurs, licences et valeurs sont inventés. À remplacer par une vraie capture (PostgreSQL, idéalement MySQL aussi) dès que possible, puis à ajuster si le format réel diffère : le DTO (`repositories/dto/HallOfFameDto.ts`) devra suivre la capture, pas l'inverse.

Forme : `{ rankings: { <catégorie>: { max_game, avg_game, max_season, avg_season, career_total: [{ licence, nom, prenom, photo, valeur }] } } }`, 9 catégories (`points`, `assists`, `rebounds`, `steals`, `blocks`, `turnovers`, `field_goal_percentage`, `three_point_percentage`, `free_throw_percentage`), 10 entrées par liste.

| Fichier | Contenu |
|---|---|
| `history-nominal.json` | 9 catégories × 5 modes × 10 entrées, valeurs numériques. |
| `history-valeurs-chaine.json` | Moyennes et pourcentages en chaînes à 2 décimales (`"12.50"`), comme un `ROUND` renvoyé par PDO. |
| `history-ex-aequo.json` | `points.max_game` avec égalités en tête et au milieu ; `field_goal_percentage.career_total` avec `72.64` / `72.58` et `61.64` / `61.58` (égaux à 1 décimale) ; `assists.max_game` : 10 joueurs à 10, même nom de famille. |
| `history-moins-de-10.json` | `points` : `max_game` vide, `avg_game` à 1 entrée, `max_season` à 3 entrées. |
| `history-photo-null.json` | `photo: null` (1er) et `photo` absent (2e) sur `points.max_game`. |
| `history-valeur-null.json` | `points.max_game` : deux entrées `valeur: null` en tête (tri PostgreSQL), puis trois valeurs réelles. |
| `history-vide.json` | Les 9 catégories, les 5 listes vides (base sans statistiques). |
| `history-tranche-invalide.json` | `rebounds.career_total[0].valeur = "abc"` ; le reste est valide. |
| `history-forme-invalide.json` | `rankings` absent (panne globale de format). |

Les cas dérivés sont produits à la main depuis le nominal ; le script de génération n'est pas versionné, les fichiers font foi.
