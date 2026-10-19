# Fixtures « joueurs »

Réponses réelles du back local, capturées le 6 octobre 2026, puis **anonymisées** : licences (`LIC…`), noms, prénoms, photos, dates de naissance et valeurs des mesures physiques sont fictifs (données de mineurs). Les noms des clubs adverses (`match_libelle`) sont ceux des fixtures du calendrier.

| Fichier | Source | Dérivation |
|---|---|---|
| `saison-joueurs.json` | `GET /api/saisons/4/joueurs` | Une photo (`LIC1003`) et un logo (`LIC1004`) mis à `null`. |
| `saison-joueurs-doublon.json` | idem | `LIC2000` répété (doublon `participer`). |
| `saison-joueurs-vide.json` | — | `[]`. |
| `joueurs.json` | `GET /api/joueurs` | `LIC3000` : ancien joueur, absent de la saison 4. |
| `joueur-complet.json` | `GET /api/joueurs/LIC1000` | Lignes des matchs 49 à 53 retirées (à venir dans le calendrier E2E). Minutes `"32"` (ligne 3) et `null` (ligne 4) ; `q4_fautes` et `q4_contres` à `null` (ligne 5). Deux examens ajoutés (ids 31 et 25, copies modifiées des réels), liste dans le désordre, un tir de type `"Corner"` (inconnu). |
| `joueur-coequipier.json` | `GET /api/joueurs/LIC2000` | Matchs 49 à 53 retirés. |
| `joueur-hors-inscription.json` | idem | Trois lignes de la saison 1 ajoutées : `LIC2000` n'est inscrit que sur la saison 4 (Q5). |
| `joueur-autre-saison.json` | `GET /api/joueurs/LIC3000` | `stats` et `examens` vidés : aucune saison commune avec `LIC1000` (avec `saisons-joueur-LIC3000-vide.json`). |
| `joueur-sans-stats.json` | `GET /api/joueurs/LIC4000` | `stats` et `examens` vidés. |
| `joueur-doublon.json` | dérivé de `joueur-complet` | Dernière ligne dupliquée (même `Id_Match`, `id` 9999). |
| `joueur-stats-invalides.json` | dérivé | `q2_fautes` absent de la première ligne. |
| `joueur-examens-invalides.json` | dérivé | `shoots[0].x` en chaîne. |
| `joueur-404.json` | `GET /api/joueurs/INCONNU` | — |
| `saisons-joueur-LIC2000.json`, `saisons-joueur-LIC4000.json` | `GET /saisons/{licence}` | — |
| `saisons-joueur-LIC3000-vide.json` | — | `[]`. |
| `physics.json` | `GET /physics/LIC1000` (PostgreSQL JSONB) | Valeurs fictives ; trois mesures plus anciennes ajoutées **en fin de liste** (dates non triées). |
| `physics-mysql.json` | dérivé | Même contenu sous la forme MySQL (`id` entier, `licence`, `created_at`, `updated_at`, types `height` / `vertical_jump`). |
| `physics-type-inconnu.json` | dérivé | Une entrée `"Détente verticale"`. |
| `physics-vide.json` | `GET /physics/LIC4000` | `[]`. |
| `physics-cree.json` | dérivé | Forme de la réponse 201 JSONB (`AppController::addPhysics`). Le `POST` réel n'a **pas** été appelé pour ne pas écrire dans la base locale. |
| `physics-422.json` | `POST /api/physics` 422 | Corps réel (valeur non numérique). |

Constats relevés sur les données réelles : voir `doc/implementation/player.md` § 4.
