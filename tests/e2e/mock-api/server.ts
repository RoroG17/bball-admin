/**
 * Faux back Laravel pour les tests e2e. Sert les fixtures de `tests/fixtures/home/`, `calendar/`, `game-detail/` et `player/`.
 *
 * Contrôle (appelé par les tests, pas par l'app) :
 *   POST /__scenario  état partiel, appliqué sur l'état par défaut (tout ce qui n'est pas précisé est réinitialisé) :
 *                     { accueil?: "en-cours" | "debut-saison" | "fin-saison" | "saison-vide" | "error",
 *                       matchs?: "nominal" | "fin-saison" | "vide" | "error",
 *                       equipe?: "ok" | "error",
 *                       saisons?: "admin" | "sans-equipe",
 *                       saisonsJoueur?: "ok" | "vide",
 *                       match?: GameDetailScenario (voir plus bas),
 *                       joueurs?: "ok" | "vide" | "doublon" | "error",
 *                       joueur?: "nominal" | "doublon" | "stats-invalides" | "examens-invalides" | "error"   (fiche LIC1000),
 *                       coequipier?: "nominal" | "hors-inscription" | "saison-sans-stats"                           (fiche LIC2000),
 *                       physics?: "ok" | "type-inconnu" | "vide" | "mysql" | "error",
 *                       physicsPost?: "created" | "422" | "error",
 *                       historique?: "nominal" | "vide" | "ex-aequo" | "moins-de-10" | "photo-null" | "valeur-null" | "tranche-invalide" | "forme-invalide" | "valeurs-chaine" | "error"   (GET /api/history),
 *                       auth?: "ok" | "indisponible" | "limite" | "lent"   (POST /connect et /update : normal, 500, 429, réponse retardée de 1,5 s),
 *                       session401?: boolean   (toute route de données appelée avec un Bearer répond 401 : back protégé, jeton refusé) }
 *                       adminWrite?: "ok" | "422" | "404" | "404-season" | "404-team" | "error" | "slow"   (toute écriture POST / PUT / DELETE sur /api/* sauf /api/physics :
 *                           ok = appliquée au magasin en mémoire, 422 / 404 / 500 = réponse fixe, slow = ok après 1,5 s),
 *                       equipes?: "ok" | "vide" | "error" | "lent"   (GET /api/equipes et /api/equipes/{id} : 16 équipes, aucune, 500, liste retardée de 1,5 s),
 *                       users?: "ok" | "error" | "chaines" | "vide" | "historiques" | "invalide" | "lent"   (GET /api/users : magasin de admin-team/users.json ; has_password en chaînes, aucun compte, comptes historiques `Jean Pierre.Martin` et `Admin ` (admin-user/), has_password invalide, liste retardée de 1,5 s),
 *                       adminPlayer?: "ok" | "vide" | "multi-equipes" | "error" | "sans-compte" | "sans-saison"
 *                           (administration des joueurs : liste en mémoire de player/joueurs.json ou admin-player/joueurs-equipes.json, aucun joueur, GET /api/joueurs en 500,
 *                           création sans compte, aucune saison),
 *                       adminGame?: "off" | "ok"   (administration des matchs : "ok" = GET /api/matchs/{id} lit le magasin de matchs en mémoire au lieu du scénario `match`),
 *                       matchsReview?: "ok" | "vide" | "error" | "format-invalide"   (GET /api/matchs/review : matchs joués sans ligne de stats, dérivés du magasin ; liste vide ; 500 ; corps inattendu),
 *                       matchsStats?: "auto" | "avec" | "sans" | "inconnu" | "erreur"   (lignes de stats du match lu avec adminGame "ok" : selon le magasin, 10 lignes, aucune, illisibles, 500),
 *                       adminSeason?: "ok" | "vide" | "multi" | "error"
 *                           (administration des saisons : magasin en mémoire de home/saisons-admin.json (ou calendar/saisons-sans-equipe.json avec `saisons: "sans-equipe"`),
 *                           aucune saison, admin-season/seasons-list-200.json (5 saisons), GET /api/saisons et /api/saisons/{id} en 500) }
 *                       logs?: "page" | "empty" | "hostile" | "invalid" | "error" | "slow"   (admin-logs, GET /api/logs/errors et /api/logs/requests : jeu reconstruit de 134 erreurs / 120 requêtes
 *                           paginé et filtré comme `LogController` (platform, os, source) ; aucune ligne ; contenu hostile ; source invalide ; 500 ; réponse retardée de 1,5 s),
 *                       logsBack?: "actuel" | "livre"   (admin-logs : "actuel" = le back du 12/10/2026, `/api/logs/requests` répond 404 et username / from / to / route / status_min sont IGNORÉS ;
 *                           "livre" = B-LOG-1 à B-LOG-4 livrés : requêtes servies, tous les filtres appliqués) }
 *   GET  /__log-queries   appels reçus par /api/logs/* depuis le dernier changement de scénario, dans l'ordre : { path, query, headers }
 *   GET  /__hits      nombre d'appels à /accueil, /api/matchs, /api/equipes/1, /api/matchs/{id}, /api/joueurs/{licence}, /api/history,
 *                     /connect, /update et /sanctum/csrf-cookie depuis le dernier changement de scénario ; `adminReads` = lectures
 *                     d'administration (/api/equipes hors /1, /api/users, /api/saisons, /api/joueurs)
 *   GET  /__writes    écritures reçues depuis le dernier changement de scénario, dans l'ordre : { method, path, body, authorization }
 *   Équipes (magasin en mémoire, tests/fixtures/admin-team/equipes.json, réinitialisé à chaque scénario) : FAC Basket (id 1) est l'équipe du
 *   club (saisons 1 et 4) ; « Étoile Cugnaux » (id 15) n'a ni joueur ni match ; « Basket Inconnu » (id 16) a un logo introuvable (404).
 *   Joueurs (magasin en mémoire, réinitialisé à chaque scénario) : `GET /api/joueurs` liste le magasin ; `POST` / `PUT` / `DELETE /api/joueurs…` le modifient comme le back
 *   (création : compte `prenom.nom` sans mot de passe sauf `sans-compte` ; `PUT` : photo absente = photo effacée ; suppression : compte et inscriptions emportés) ;
 *   `POST /api/participer` ajoute une inscription (sans clé unique, comme le back) ; `/saisons/{licence}` d'un joueur créé suit ses inscriptions ;
 *   `GET /api/joueurs/{licence}` : fiche des fixtures pour LIC1000 à LIC4000 (stats, examens), sinon fiche vide issue du magasin ; 404 si absent du magasin.
 *   Saisons (magasin en mémoire, réinitialisé à chaque scénario) : `GET /api/saisons`, `GET /api/saisons/{id}` (`{ saison, participer }`, 404 si absente) ; `POST` / `PUT` / `DELETE /api/saisons…`
 *   comme `SaisonResource` (422 si champ absent ou non entier, 500 si l'équipe n'existe pas, `PUT` / `DELETE` en 404 si absente ; une saison supprimée emporte ses participants et ses matchs).
 *   Participants : saison 4 = les 12 joueurs de `player/saison-joueurs.json`, saison 1 = LIC1000, LIC2000, LIC3000 ; `POST /api/participer` ajoute une ligne SANS clé unique (doublon accepté),
 *   `DELETE /api/participer` efface toutes les lignes du couple (200 même si absent) ; `/saisons/{licence}` d'un joueur dont les inscriptions ont été touchées suit ces participants.
 *   Matchs (magasin en mémoire, réinitialisé à chaque scénario, issu de calendar/matchs.e2e.json) : `GET /api/matchs` le liste ; `POST` / `PUT` / `DELETE /api/matchs…` le modifient comme
 *   `MatchResource` (422 si champ absent ou invalide, 404 « L'équipe n'existe pas » / « La saison n'existe pas » / « Match non trouvé », création à 0-0 sans vidéo, `PUT` : `video` nul ou vide conserve l'ancienne).
 *   Saison 4 = 18 matchs (36 à 53) dont le 41 à égalité 70-70, le 49 « score à saisir » (0-0 passé), les 50 à 53 à venir ; saison 1 = 14 matchs. Tous les matchs joués ont des stats (10 lignes) SAUF le 48 (à saisir).
 *   Comptes de la liste (admin-user, magasin `userRecords` en mémoire, réinitialisé à chaque scénario) : `POST /api/users` crée un compte SANS joueur (B6 : `joueur` ignoré, 422 si identifiant vide ou déjà pris en comparaison stricte) ; `PUT /api/users/{username}` efface le mot de passe de toutes les lignes de ce nom exact (404 sinon) ; `DELETE` supprime la première (404 sinon).
 *   Comptes (POST /connect, /update) : `admin` / `admin-e2e` (admin), `lucas` / `lucas-e2e` (joueur LIC1000),
 *   `nouveau.joueur` sans mot de passe (LIC1000, devient connectable après /update). Les mots de passe sont réinitialisés à chaque scénario.
 *   Joueurs : LIC1000 = Lucas MARCHAND (session « joueur » des tests), LIC2000 = coéquipier, LIC3000 = ancien joueur sans saison commune, LIC4000 = sans stats.
 */
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage } from "node:http";
import path from "node:path";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);
const FIXTURES = path.resolve(__dirname, "../../fixtures");

// PNG 1×1 transparent, pour les logos et photos.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const fixture = (dir: string, name: string) => readFileSync(path.join(FIXTURES, dir, name), "utf8");

/** Fiche match : `GET /api/matchs/{id}` sert `match-{scénario}.json` (l'`idMatch` prend la valeur demandée). */
type GameDetailScenario =
  | "joue"
  | "joue-tirs"
  | "sans-stats"
  | "a-venir"
  | "score-a-saisir"
  | "doublon"
  | "ecart-score"
  | "video-url"
  | "video-invalide"
  | "minutes"
  | "format-invalide"
  | "tirs-invalides"
  | "error";

/** Identifiant inconnu du faux back : 404 comme le vrai. */
const UNKNOWN_GAME_ID = "999999";

type State = {
  accueil: string;
  matchs: "nominal" | "fin-saison" | "vide" | "error";
  equipe: "ok" | "error";
  saisons: "admin" | "sans-equipe";
  saisonsJoueur: "ok" | "vide";
  match: GameDetailScenario;
  joueurs: "ok" | "vide" | "doublon" | "error";
  joueur: "nominal" | "doublon" | "stats-invalides" | "examens-invalides" | "error";
  coequipier: "nominal" | "hors-inscription" | "saison-sans-stats";
  physics: "ok" | "type-inconnu" | "vide" | "mysql" | "error";
  physicsPost: "created" | "422" | "error";
  auth: "ok" | "indisponible" | "limite" | "lent";
  session401: boolean;
  adminWrite: "ok" | "422" | "404" | "404-season" | "404-team" | "error" | "slow";
  equipes: "ok" | "vide" | "error" | "lent";
  users: "ok" | "error" | "chaines" | "vide" | "historiques" | "invalide" | "lent";
  adminPlayer: "ok" | "vide" | "multi-equipes" | "error" | "sans-compte" | "sans-saison";
  adminSeason: "ok" | "vide" | "multi" | "error";
  adminGame: "off" | "ok";
  matchsReview: "ok" | "vide" | "error" | "format-invalide";
  matchsStats: "auto" | "avec" | "sans" | "inconnu" | "erreur";
  logs: "page" | "empty" | "hostile" | "invalid" | "error" | "slow";
  logsBack: "actuel" | "livre";
  historique:
    | "nominal"
    | "vide"
    | "ex-aequo"
    | "moins-de-10"
    | "photo-null"
    | "valeur-null"
    | "tranche-invalide"
    | "forme-invalide"
    | "valeurs-chaine"
    | "error";
};

const DEFAULT_STATE: State = {
  accueil: "en-cours",
  matchs: "nominal",
  equipe: "ok",
  saisons: "admin",
  saisonsJoueur: "ok",
  match: "joue-tirs",
  joueurs: "ok",
  joueur: "nominal",
  coequipier: "nominal",
  physics: "ok",
  physicsPost: "created",
  historique: "nominal",
  auth: "ok",
  session401: false,
  adminWrite: "ok",
  equipes: "ok",
  users: "ok",
  adminPlayer: "ok",
  adminSeason: "ok",
  adminGame: "off",
  matchsReview: "ok",
  matchsStats: "auto",
  logs: "page",
  logsBack: "actuel",
};

let state: State = { ...DEFAULT_STATE };
const NO_HITS = {
  accueil: 0,
  matchs: 0,
  equipes: 0,
  match: 0,
  joueur: 0,
  history: 0,
  connect: 0,
  update: 0,
  csrf: 0,
  adminReads: 0,
};
let hits = { ...NO_HITS };

/** Équipe du back : `GET /api/equipes` renvoie un tableau nu de ces objets, sans tri. */
type TeamRecord = { Id_Equipe: number; nom: string; logo: string | null };
type WriteRecord = { method: string; path: string; body: unknown; authorization: string | null };
const loadTeams = (): TeamRecord[] => JSON.parse(fixture("admin-team", "equipes.json")) as TeamRecord[];
let teams: TeamRecord[] = loadTeams();
let writes: WriteRecord[] = [];

/** Journaux (admin-logs) : jeux reconstruits de tests/fixtures/admin-logs/ et appels reçus. */
type LogRow = {
  platform: string | null;
  os: string | null;
  source?: string;
  route: string | null;
  status_code: number | null;
  created_at: string;
  user: { username: string } | null;
};
let logQueries: { path: string; query: Record<string, string>; headers: Record<string, string> }[] = [];
const logRows = (kind: "errors" | "requests"): LogRow[] =>
  JSON.parse(fixture("admin-logs", kind === "errors" ? "errors-all.json" : "requests-all.json")) as LogRow[];

/** Comme `LogController` : paginate() de Laravel ; les filtres inconnus du back actuel sont ignorés. */
function paginateLogs(kind: "errors" | "requests", params: URLSearchParams): unknown {
  let rows = logRows(kind);
  const delivered = state.logsBack === "livre";
  const platform = params.get("platform");
  if (platform) rows = rows.filter((row) => row.platform === platform);
  const os = params.get("os");
  if (os) rows = rows.filter((row) => (row.os ?? "").toLowerCase().includes(os.toLowerCase()));
  const source = params.get("source");
  if (source && kind === "errors") rows = rows.filter((row) => row.source === source);
  if (delivered) {
    const username = params.get("username");
    if (username) rows = rows.filter((row) => row.user?.username === username);
    const route = params.get("route");
    if (route) rows = rows.filter((row) => (row.route ?? "").includes(route));
    const min = Number(params.get("status_min") ?? "");
    const max = Number(params.get("status_max") ?? "");
    if (params.get("status_min")) rows = rows.filter((row) => row.status_code !== null && row.status_code >= min && row.status_code <= max);
    const from = params.get("from");
    if (from) rows = rows.filter((row) => Date.parse(row.created_at) >= Date.parse(from));
    const to = params.get("to");
    if (to) rows = rows.filter((row) => Date.parse(row.created_at) <= Date.parse(to));
  }
  const perPage = Number(params.get("per_page") ?? "50") || 50;
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
  const data = rows.slice((page - 1) * perPage, page * perPage);
  return {
    current_page: page,
    data,
    last_page: lastPage,
    per_page: perPage,
    total: rows.length,
    links: [{ url: "http://localhost:8000/api/logs?page=1", label: "1", active: true }],
    next_page_url: null,
  };
}
const teamById = (id: number): TeamRecord | undefined => teams.find((team) => team.Id_Equipe === id);
const teamByName = (name: string): TeamRecord | undefined => teams.find((team) => team.nom === name);

/** Joueur du back : `GET /api/joueurs` renvoie `{ joueurs: [...] }` de ces objets (équipe et logo joints). */
type PlayerRecord = {
  licence: string;
  nom: string;
  prenom: string;
  civilite: string;
  date_naissance: string;
  photo: string | null;
  Id_Equipe: number;
  equipe: string;
  logo: string | null;
  physics: unknown[];
};
type UserRecord = { username: string; joueur: string | null; nom: string | null; prenom: string | null; equipe: string | null; has_password: number | string };
const loadPlayers = (): PlayerRecord[] => {
  if (state.adminPlayer === "vide") return [];
  const file = state.adminPlayer === "multi-equipes" ? ["admin-player", "joueurs-equipes.json"] : ["player", "joueurs.json"];
  return (JSON.parse(fixture(file[0], file[1])) as { joueurs: PlayerRecord[] }).joueurs;
};
const USER_FIXTURES: Partial<Record<State["users"], string>> = {
  chaines: "users-200-string-flags.json",
  vide: "users-200-empty.json",
  historiques: "users-200-historiques.json",
  invalide: "users-200-invalid-flag.json",
};
const loadUsers = (): UserRecord[] => {
  const adminUserFile = USER_FIXTURES[state.users];
  const raw = adminUserFile ? fixture("admin-user", adminUserFile) : fixture("admin-team", "users.json");
  return (JSON.parse(raw) as { users: UserRecord[] }).users;
};
let players: PlayerRecord[] = loadPlayers();
let userRecords: UserRecord[] = loadUsers();
/** Joueurs créés depuis le dernier scénario : leurs inscriptions viennent de `enrollments`, pas des fixtures. */
let createdLicences = new Set<string>();
/** Joueurs modifiés par `PUT` : leur fiche reprend les valeurs du magasin. */
let modifiedLicences = new Set<string>();
let enrollments: Record<string, number[]> = {};

/** Saison du back : `GET /api/saisons` renvoie un tableau nu de ces objets (nombres parfois en chaîne selon le SGBD). */
type SeasonRecord = {
  Id_Saison: number | string;
  annee_debut: number | string;
  annee_fin: number | string;
  championnat: string;
  categorie: string;
  equipe: number | string | null;
};
const seasonId = (season: SeasonRecord): number => Number(season.Id_Saison);
const loadSeasons = (): SeasonRecord[] => {
  if (state.adminSeason === "vide" || state.adminPlayer === "sans-saison") return [];
  const file =
    state.adminSeason === "multi"
      ? ["admin-season", "seasons-list-200.json"]
      : state.saisons === "sans-equipe"
        ? ["calendar", "saisons-sans-equipe.json"]
        : ["home", "saisons-admin.json"];
  return JSON.parse(fixture(file[0], file[1])) as SeasonRecord[];
};
/** Participants initiaux : saison 4 = les 12 joueurs de `player/saison-joueurs.json`, saison 1 = trois joueurs, les autres aucun. */
const loadParticipants = (): Record<number, string[]> => ({
  4: (JSON.parse(fixture("player", "saison-joueurs.json")) as { licence: string }[]).map((player) => player.licence),
  1: ["LIC1000", "LIC2000", "LIC3000"],
});
let seasons: SeasonRecord[] = loadSeasons();
let seasonParticipants: Record<number, string[]> = loadParticipants();
/** Licences dont les inscriptions ont été touchées par `POST` / `DELETE /api/participer` : `/saisons/{licence}` suit alors les participants. */
let touchedLicences = new Set<string>();
/** Saisons supprimées : leurs matchs disparaissent de `GET /api/matchs` (cascade `matchs.Id_Saison`). */
let deletedSeasonIds = new Set<number>();

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });

/** Comptes du faux back : mot de passe (`null` = à initialiser) et licence. */
type Account = { password: string | null; joueur: string | null };
const DEFAULT_ACCOUNTS: Record<string, Account> = {
  admin: { password: "admin-e2e", joueur: null },
  lucas: { password: "lucas-e2e", joueur: "LIC1000" },
  "nouveau.joueur": { password: null, joueur: "LIC1000" },
};
let accounts: Record<string, Account> = structuredClone(DEFAULT_ACCOUNTS);
/** Mesures créées par `POST /api/physics` depuis le dernier scénario : relues par `GET /physics/{licence}` (P7). */
let createdPhysics: Record<string, unknown>[] = [];

const PLAYER_DETAIL_FILES: Record<string, string> = {
  LIC3000: "joueur-autre-saison.json",
  LIC4000: "joueur-sans-stats.json",
};
const PLAYER_SEASONS: Record<string, string | null> = {
  LIC2000: "saisons-joueur-LIC2000.json",
  LIC3000: "saisons-joueur-LIC3000-vide.json",
  LIC4000: "saisons-joueur-LIC4000.json",
};
const PHYSICS_FILES = {
  ok: "physics.json",
  "type-inconnu": "physics-type-inconnu.json",
  vide: "physics-vide.json",
  mysql: "physics-mysql.json",
} as const;

const parisDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Remplace les marqueurs `@today±n` par une date `YYYY-MM-DD` relative au jour de Paris. */
function withRelativeDates(body: string): string {
  const [y, m, d] = parisDate.format(new Date()).split("-").map(Number);
  return body.replace(/"@today([+-]\d+)?"/g, (_, offset: string | undefined) => {
    const date = new Date(Date.UTC(y, m - 1, d + Number(offset ?? 0)));
    return JSON.stringify(date.toISOString().slice(0, 10));
  });
}

/** Match du back tel que `GET /api/matchs` le liste, plus la vidéo (absente de la liste) ; les ids d'équipe viennent du magasin d'équipes. */
type GameRecord = {
  idMatch: number;
  numero: number;
  dateMatch: string;
  equipeDom: string;
  equipeExt: string;
  scoreDom: number;
  scoreExt: number;
  logoDom: string | null;
  logoExt: string | null;
  idSaison: number;
  video: string | null;
};
const loadGames = (): GameRecord[] => {
  if (state.matchs === "vide") return [];
  const raw = state.matchs === "fin-saison" ? fixture("calendar", "matchs.json") : withRelativeDates(fixture("calendar", "matchs.e2e.json"));
  return (JSON.parse(raw) as Omit<GameRecord, "video">[]).map((game) => ({ ...game, video: null }));
};
let games: GameRecord[] = loadGames();
/** Matchs joués qui ont des lignes de stats : tous, sauf le 48 (« à saisir »). */
const loadGamesWithStats = (): Set<number> =>
  new Set(games.filter((game) => (game.scoreDom !== 0 || game.scoreExt !== 0) && game.idMatch !== 48).map((game) => game.idMatch));
let gamesWithStats: Set<number> = loadGamesWithStats();
const toGameListEntry = (game: GameRecord) => ({
  idMatch: game.idMatch,
  numero: game.numero,
  dateMatch: game.dateMatch,
  equipeDom: game.equipeDom,
  equipeExt: game.equipeExt,
  scoreDom: game.scoreDom,
  scoreExt: game.scoreExt,
  logoDom: game.logoDom,
  logoExt: game.logoExt,
  idSaison: game.idSaison,
});

/** Écriture sur les matchs, comme `MatchResource` ; `false` si le chemin n'est pas le leur. */
function answerGameWrite(method: string, pathname: string, body: unknown, json: (status: number, body: string) => void): boolean {
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const isBlank = (key: string) => input[key] === undefined || input[key] === null || input[key] === "";
  const validDate = typeof input.date_match === "string" && /^\d{4}-\d{2}-\d{2}/.test(input.date_match) && !Number.isNaN(Date.parse(input.date_match));
  /** `required|date`, `required|integer` : aucune borne, aucun `min` ni `different`. */
  const validate = (keys: string[]): string | null => {
    if (isBlank("date_match") || keys.some(isBlank)) return fixture("admin-game", "match-422-required.json");
    if (!validDate) return fixture("admin-game", "match-422-date.json");
    if (keys.some((key) => !Number.isInteger(Number(input[key])))) return fixture("admin-game", "match-422-required.json");
    return null;
  };
  const CREATE_KEYS = ["numero", "equipe_domicile", "equipe_exterieur", "Id_Saison"];
  /** 404 (et non 422) si l'équipe ou la saison n'existe pas. */
  const missingReference = (): string | null => {
    if (!teamById(Number(input.equipe_domicile)) || !teamById(Number(input.equipe_exterieur))) return fixture("admin-game", "match-404-equipe.json");
    if (!seasons.some((season) => seasonId(season) === Number(input.Id_Saison))) return fixture("admin-game", "match-404-saison.json");
    return null;
  };

  if (method === "POST" && pathname === "/api/matchs") {
    const invalid = validate(CREATE_KEYS);
    if (invalid) {
      json(422, invalid);
      return true;
    }
    const missing = missingReference();
    if (missing) {
      json(404, missing);
      return true;
    }
    const home = teamById(Number(input.equipe_domicile));
    const away = teamById(Number(input.equipe_exterieur));
    const created: GameRecord = {
      idMatch: Math.max(0, ...games.map((game) => game.idMatch)) + 1,
      numero: Number(input.numero),
      dateMatch: String(input.date_match).slice(0, 10),
      equipeDom: home?.nom ?? "",
      equipeExt: away?.nom ?? "",
      scoreDom: 0,
      scoreExt: 0,
      logoDom: home?.logo ?? null,
      logoExt: away?.logo ?? null,
      idSaison: Number(input.Id_Saison),
      video: null,
    };
    games.push(created);
    json(
      201,
      JSON.stringify({
        Id_Match: created.idMatch,
        date_match: created.dateMatch,
        numero: created.numero,
        equipe_domicile: Number(input.equipe_domicile),
        equipe_exterieur: Number(input.equipe_exterieur),
        score_domicile: 0,
        score_exterieur: 0,
        Id_Saison: created.idSaison,
        video: null,
      }),
    );
    return true;
  }

  const gamePath = pathname.match(/^\/api\/matchs\/(\d+)$/);
  if (!gamePath) return false;
  const game = games.find((candidate) => String(candidate.idMatch) === gamePath[1]);
  if (!game) {
    json(404, fixture("admin-game", "match-404.json"));
    return true;
  }
  if (method === "PUT") {
    // `update` : 404 du match avant la validation, puis 404 de l'équipe ou de la saison.
    const invalid = validate([...CREATE_KEYS, "score_domicile", "score_exterieur"]);
    if (invalid) {
      json(422, invalid);
      return true;
    }
    const missing = missingReference();
    if (missing) {
      json(404, missing);
      return true;
    }
    const home = teamById(Number(input.equipe_domicile));
    const away = teamById(Number(input.equipe_exterieur));
    game.numero = Number(input.numero);
    game.dateMatch = String(input.date_match).slice(0, 10);
    game.equipeDom = home?.nom ?? game.equipeDom;
    game.equipeExt = away?.nom ?? game.equipeExt;
    game.logoDom = home?.logo ?? null;
    game.logoExt = away?.logo ?? null;
    game.scoreDom = Number(input.score_domicile);
    game.scoreExt = Number(input.score_exterieur);
    game.idSaison = Number(input.Id_Saison);
    // `updateMatch` : `$data['video'] ?? $this->video`, et Laravel convertit "" en null : un champ vide conserve l'ancienne valeur.
    if (typeof input.video === "string" && input.video !== "") game.video = input.video;
    json(200, fixture("admin-game", "match-updated-200.json"));
    return true;
  }
  if (method === "DELETE") {
    games = games.filter((candidate) => candidate !== game);
    gamesWithStats.delete(game.idMatch);
    json(200, fixture("admin-game", "match-delete-200.json"));
    return true;
  }
  return false;
}

/** `GET /api/matchs/{id}` avec `adminGame: "ok"` : le match vient du magasin, les stats de la fiche `match-joue` (10 lignes) ou `match-sans-stats`. */
function answerGameDetail(id: string, json: (status: number, body: string) => void, serverError: () => void) {
  if (state.matchsStats === "erreur" || !/^\d+$/.test(id)) return serverError();
  const game = games.find((candidate) => String(candidate.idMatch) === id);
  if (!game) return json(404, fixture("admin-game", "match-404.json"));
  const withStats = state.matchsStats === "avec" || (state.matchsStats === "auto" && gamesWithStats.has(game.idMatch));
  const payload = JSON.parse(fixture("game-detail", withStats ? "match-joue.json" : "match-sans-stats.json")) as {
    match: Record<string, unknown>;
    stats: unknown;
    avg: Record<string, unknown>;
  };
  payload.match = {
    ...toGameListEntry(game),
    idDom: teamByName(game.equipeDom)?.Id_Equipe ?? 0,
    idExt: teamByName(game.equipeExt)?.Id_Equipe ?? 0,
    Id_Saison: game.idSaison,
    video: game.video,
  };
  payload.avg.Id_Saison = game.idSaison;
  if (state.matchsStats === "inconnu") payload.stats = "illisible";
  return json(200, JSON.stringify(payload));
}

/** Écriture sur les joueurs ou les inscriptions, comme `JoueurResource` et `Participer` ; `false` si le chemin n'est pas le leur. */
function answerPlayerWrite(method: string, pathname: string, body: unknown, json: (status: number, body: string) => void): boolean {
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string) : null);

  if (method === "POST" && pathname === "/api/participer") {
    const licence = text("licence") ?? "";
    const targetSeason = Number(input.Id_Saison);
    if (!players.some((player) => player.licence === licence) || !seasons.some((season) => seasonId(season) === targetSeason)) {
      json(422, fixture("admin-player", "participer-422.json"));
      return true;
    }
    // Pas de clé primaire sur `participer` : un doublon est accepté, comme le vrai back.
    enrollments[licence] = [...(enrollments[licence] ?? []), targetSeason];
    seasonParticipants[targetSeason] = [...(seasonParticipants[targetSeason] ?? []), licence];
    touchedLicences.add(licence);
    json(201, fixture("admin-player", "participer-201.json"));
    return true;
  }

  if (method === "DELETE" && pathname === "/api/participer") {
    const licence = text("licence") ?? "";
    const targetSeason = Number(input.Id_Saison);
    if (!licence || !Number.isFinite(targetSeason)) {
      json(422, fixture("admin-player", "participer-422.json"));
      return true;
    }
    // `delete()` du couple : toutes les lignes, et 200 même s'il n'y en a aucune.
    seasonParticipants[targetSeason] = (seasonParticipants[targetSeason] ?? []).filter((candidate) => candidate !== licence);
    if (enrollments[licence]) enrollments[licence] = enrollments[licence].filter((id) => id !== targetSeason);
    touchedLicences.add(licence);
    json(200, fixture("admin", "participer-delete-200.json"));
    return true;
  }

  if (method === "POST" && pathname === "/api/joueurs") {
    const licence = text("licence") ?? "";
    if (players.some((player) => player.licence === licence)) {
      json(422, fixture("admin-player", "creation-422-licence.json"));
      return true;
    }
    const required = ["licence", "nom", "prenom", "civilite", "date_naissance"].every((key) => text(key));
    const team = teams.find((candidate) => candidate.Id_Equipe === Number(input.equipe));
    // Pas de `exists` ni de `max:8` côté back : une équipe inconnue ou une licence trop longue est une erreur SQL (500).
    if (!required) {
      json(422, fixture("admin-player", "creation-422-vide.json"));
      return true;
    }
    if (!team || licence.length > 8) {
      json(500, fixture("admin-player", "creation-500.json"));
      return true;
    }
    const created: PlayerRecord = {
      licence,
      nom: text("nom") ?? "",
      prenom: text("prenom") ?? "",
      civilite: text("civilite") ?? "",
      date_naissance: text("date_naissance") ?? "",
      photo: text("photo"),
      Id_Equipe: team.Id_Equipe,
      equipe: team.nom,
      logo: team.logo,
      physics: [],
    };
    players.push(created);
    createdLicences.add(licence);
    // `User::createUser(prenom.nom, licence)` : mot de passe nul.
    if (state.adminPlayer !== "sans-compte") {
      userRecords.push({ username: `${created.prenom}.${created.nom}`, joueur: licence, nom: created.nom, prenom: created.prenom, equipe: team.nom, has_password: 0 });
    }
    json(201, JSON.stringify({ licence, nom: created.nom, prenom: created.prenom, civilite: created.civilite, date_naissance: created.date_naissance, photo: created.photo, Id_Equipe: team.Id_Equipe }));
    return true;
  }

  const playerPath = pathname.match(/^\/api\/joueurs\/([^/]+)$/);
  if (playerPath) {
    const licence = decodeURIComponent(playerPath[1]);
    const player = players.find((candidate) => candidate.licence === licence);
    if (!player) {
      json(404, fixture("admin-player", "update-404.json"));
      return true;
    }
    if (method === "PUT") {
      const team = teams.find((candidate) => candidate.Id_Equipe === Number(input.Id_Equipe));
      if (!team) {
        json(500, fixture("admin-player", "creation-500.json"));
        return true;
      }
      // `Joueur::updateJoueur` : champs absents conservés, mais `photo ?? null` efface la photo.
      player.nom = text("nom") ?? player.nom;
      player.prenom = text("prenom") ?? player.prenom;
      player.civilite = text("civilite") ?? player.civilite;
      player.date_naissance = text("date_naissance") ?? player.date_naissance;
      player.photo = text("photo");
      player.Id_Equipe = team.Id_Equipe;
      player.equipe = team.nom;
      player.logo = team.logo;
      modifiedLicences.add(licence);
      json(200, JSON.stringify(player));
      return true;
    }
    if (method === "DELETE") {
      players = players.filter((candidate) => candidate !== player);
      userRecords = userRecords.filter((user) => user.joueur !== licence);
      delete enrollments[licence];
      for (const id of Object.keys(seasonParticipants)) {
        seasonParticipants[Number(id)] = seasonParticipants[Number(id)].filter((candidate) => candidate !== licence);
      }
      json(200, fixture("admin-player", "delete-200.json"));
      return true;
    }
  }
  return false;
}

/** Écriture sur les saisons, comme `SaisonResource` ; `false` si le chemin n'est pas le leur. */
function answerSeasonWrite(method: string, pathname: string, body: unknown, json: (status: number, body: string) => void): boolean {
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const REQUIRED = ["annee_debut", "annee_fin", "championnat", "categorie", "equipe"];
  const INTEGERS = ["annee_debut", "annee_fin", "equipe"];
  /** Validation de `store` / `update` : `required|integer` / `required|string`, aucune borne, aucun `exists`. */
  const validate = (): string | null => {
    if (REQUIRED.some((key) => input[key] === undefined || input[key] === null || input[key] === "")) {
      return fixture("admin-season", "season-422-required.json");
    }
    if (INTEGERS.some((key) => !Number.isInteger(Number(input[key])))) return fixture("admin-season", "season-422-integer.json");
    return null;
  };

  if (method === "POST" && pathname === "/api/saisons") {
    const invalid = validate();
    if (invalid) {
      json(422, invalid);
      return true;
    }
    // Pas de `exists:equipes` : une équipe inconnue est une violation de FK (500).
    if (!teams.some((team) => team.Id_Equipe === Number(input.equipe))) {
      json(500, fixture("admin-season", "season-team-fk-500.json"));
      return true;
    }
    const created: SeasonRecord = {
      annee_debut: Number(input.annee_debut),
      annee_fin: Number(input.annee_fin),
      championnat: String(input.championnat),
      categorie: String(input.categorie),
      equipe: Number(input.equipe),
      Id_Saison: Math.max(0, ...seasons.map(seasonId)) + 1,
    };
    seasons.push(created);
    seasonParticipants[seasonId(created)] = [];
    json(201, JSON.stringify(created));
    return true;
  }

  const seasonPath = pathname.match(/^\/api\/saisons\/(\d+)$/);
  if (!seasonPath) return false;
  const season = seasons.find((candidate) => String(seasonId(candidate)) === seasonPath[1]);
  if (!season) {
    json(404, fixture("admin-season", method === "DELETE" ? "season-delete-404.json" : "season-show-404.json"));
    return true;
  }
  if (method === "PUT") {
    // `update` : 404 avant la validation.
    const invalid = validate();
    if (invalid) {
      json(422, invalid);
      return true;
    }
    if (!teams.some((team) => team.Id_Equipe === Number(input.equipe))) {
      json(500, fixture("admin-season", "season-team-fk-500.json"));
      return true;
    }
    season.annee_debut = Number(input.annee_debut);
    season.annee_fin = Number(input.annee_fin);
    season.championnat = String(input.championnat);
    season.categorie = String(input.categorie);
    season.equipe = Number(input.equipe);
    json(200, JSON.stringify(season));
    return true;
  }
  if (method === "DELETE") {
    seasons = seasons.filter((candidate) => candidate !== season);
    delete seasonParticipants[seasonId(season)];
    deletedSeasonIds.add(seasonId(season));
    json(200, fixture("admin-season", "season-delete-200.json"));
    return true;
  }
  return false;
}

/**
 * Écriture sur les comptes, comme `UserResource` : `POST` valide `username` (obligatoire, unique en comparaison STRICTE,
 * cas d'un SGBD sensible à la casse) et crée le compte SANS joueur (B6 : `joueur` est ignoré) ; `PUT` efface le mot de
 * passe de TOUTES les lignes de ce nom exact (404 si aucune) ; `DELETE` supprime la première ligne de ce nom exact.
 * `false` si le chemin n'est pas le leur.
 */
function answerUserWrite(method: string, pathname: string, body: unknown, json: (status: number, body: string) => void): boolean {
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  if (method === "POST" && pathname === "/api/users") {
    const username = typeof input.username === "string" ? input.username : "";
    if (username === "") {
      json(422, fixture("admin-user", "user-create-422-required.json"));
      return true;
    }
    if (userRecords.some((user) => user.username === username)) {
      json(422, fixture("admin-user", "user-create-422-taken.json"));
      return true;
    }
    userRecords.push({ username, joueur: null, nom: null, prenom: null, equipe: null, has_password: 0 });
    const now = new Date().toISOString();
    json(201, JSON.stringify({ username, joueur: null, updated_at: now, created_at: now, id: userRecords.length }));
    return true;
  }

  const userPath = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userPath && (method === "PUT" || method === "DELETE")) {
    const username = decodeURIComponent(userPath[1]);
    const matching = userRecords.filter((user) => user.username === username);
    if (matching.length === 0) {
      json(404, fixture("admin-user", method === "PUT" ? "user-reset-404.json" : "user-delete-404.json"));
      return true;
    }
    if (method === "PUT") {
      for (const user of matching) user.has_password = 0;
      json(200, fixture("admin-user", "user-reset-200.json"));
    } else {
      userRecords = userRecords.filter((user) => user !== matching[0]);
      json(200, fixture("admin-user", "user-delete-200.json"));
    }
    return true;
  }
  return false;
}

/** Réponse d'une écriture d'administration selon le scénario `adminWrite` (équipes et joueurs : magasins en mémoire, comme le back). */
function answerWrite(method: string, pathname: string, body: unknown, json: (status: number, body: string) => void) {
  const isPlayerPath = pathname.startsWith("/api/joueurs") || pathname === "/api/participer";
  const isSeasonPath = pathname.startsWith("/api/saisons");
  const isGamePath = pathname.startsWith("/api/matchs");
  const isUserPath = pathname.startsWith("/api/users");
  if (state.adminWrite === "404-season" || state.adminWrite === "404-team") {
    return json(404, fixture("admin-game", state.adminWrite === "404-season" ? "match-404-saison.json" : "match-404-equipe.json"));
  }
  if (state.adminWrite === "422") {
    if (isGamePath) return json(422, fixture("admin-game", "match-422-required.json"));
    if (isUserPath) return json(422, fixture("admin-user", "user-create-422-taken.json"));
    if (pathname === "/api/participer") return json(422, fixture("admin-player", "participer-422.json"));
    if (isSeasonPath) return json(422, fixture("admin-season", "season-422-required.json"));
    return json(422, fixture(isPlayerPath ? "admin-player" : "admin-team", isPlayerPath ? "creation-422-vide.json" : "equipe-422-required.json"));
  }
  if (state.adminWrite === "404") {
    // L'élément a été supprimé entre-temps : une suppression retire la ligne, comme le ferait le vrai back.
    const gone = pathname.match(/^\/api\/equipes\/(\d+)$/);
    if (method === "DELETE" && gone) teams = teams.filter((team) => String(team.Id_Equipe) !== gone[1]);
    const goneGame = pathname.match(/^\/api\/matchs\/(\d+)$/);
    if (method === "DELETE" && goneGame) games = games.filter((game) => String(game.idMatch) !== goneGame[1]);
    const goneUser = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (method === "DELETE" && goneUser) userRecords = userRecords.filter((user) => user.username !== decodeURIComponent(goneUser[1]));
    if (isUserPath) return json(404, fixture("admin-user", "user-delete-404.json"));
    if (isGamePath) return json(404, fixture("admin-game", "match-404.json"));
    const goneSeason = pathname.match(/^\/api\/saisons\/(\d+)$/);
    if (method === "DELETE" && goneSeason) {
      seasons = seasons.filter((season) => String(seasonId(season)) !== goneSeason[1]);
      deletedSeasonIds.add(Number(goneSeason[1]));
    }
    if (isSeasonPath) return json(404, fixture("admin-season", "season-show-404.json"));
    const goneJoueur = pathname.match(/^\/api\/joueurs\/([^/]+)$/);
    if (method === "DELETE" && goneJoueur) players = players.filter((player) => player.licence !== decodeURIComponent(goneJoueur[1]));
    return json(404, fixture(isPlayerPath ? "admin-player" : "admin-team", isPlayerPath ? "update-404.json" : "equipe-404.json"));
  }
  if (state.adminWrite === "error") return json(500, fixture("admin", "server-error-500.json"));
  if (answerPlayerWrite(method, pathname, body, json)) return;
  if (isUserPath && answerUserWrite(method, pathname, body, json)) return;
  if (isSeasonPath && answerSeasonWrite(method, pathname, body, json)) return;
  if (isGamePath && answerGameWrite(method, pathname, body, json)) return;

  const input = (typeof body === "object" && body !== null ? body : {}) as { nom?: string; logo?: string | null };
  if (method === "POST" && pathname === "/api/equipes") {
    const created: TeamRecord = {
      Id_Equipe: Math.max(0, ...teams.map((team) => team.Id_Equipe)) + 1,
      nom: input.nom ?? "",
      logo: input.logo ?? null,
    };
    teams.push(created);
    return json(201, JSON.stringify(created));
  }
  const teamPath = pathname.match(/^\/api\/equipes\/(\d+)$/);
  if (teamPath) {
    const team = teams.find((candidate) => String(candidate.Id_Equipe) === teamPath[1]);
    if (!team) return json(404, fixture("admin-team", "equipe-404.json"));
    if (method === "PUT") {
      // Comme `Equipe::updateEquipe` : `null` conserve l'ancienne valeur.
      team.nom = input.nom ?? team.nom;
      team.logo = input.logo ?? team.logo;
      return json(200, JSON.stringify(team));
    }
    if (method === "DELETE") {
      teams = teams.filter((candidate) => candidate !== team);
      return json(200, fixture("admin-team", "equipe-deleted-200.json"));
    }
  }
  return json(200, "{}");
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const json = (status: number, body: string) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(body);
  };
  const serverError = () => json(500, JSON.stringify({ message: "Erreur serveur" }));

  if (req.method === "POST" && url.pathname === "/__scenario") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      state = { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<State>) };
      hits = { ...NO_HITS };
      createdPhysics = [];
      accounts = structuredClone(DEFAULT_ACCOUNTS);
      teams = state.equipes === "vide" ? [] : loadTeams();
      players = loadPlayers();
      userRecords = loadUsers();
      createdLicences = new Set();
      modifiedLicences = new Set();
      enrollments = {};
      seasons = loadSeasons();
      seasonParticipants = loadParticipants();
      touchedLicences = new Set();
      deletedSeasonIds = new Set();
      games = loadGames();
      gamesWithStats = loadGamesWithStats();
      writes = [];
      logQueries = [];
      json(200, JSON.stringify(state));
    });
    return;
  }
  if (url.pathname === "/__hits") return json(200, JSON.stringify(hits));
  if (url.pathname === "/__writes") return json(200, JSON.stringify(writes));
  if (url.pathname === "/__log-queries") return json(200, JSON.stringify(logQueries));

  // Un fichier de logo « inconnu.png » n'existe pas sur le serveur : 404, comme le vrai back.
  if (url.pathname.startsWith("/public/images/logo/inconnu")) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  // Même chose pour une photo de joueur « inconnu.png ».
  if (url.pathname.startsWith("/public/images/joueur/inconnu")) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  if (url.pathname.startsWith("/public/images/")) {
    res.writeHead(200, { "Content-Type": "image/png" });
    return res.end(PIXEL);
  }

  if (url.pathname === "/sanctum/csrf-cookie") {
    hits.csrf += 1;
    res.writeHead(204);
    return res.end();
  }

  // Comme `UserController::connect` / `updatePassword` (routes web, sans authentification).
  if (req.method === "POST" && (url.pathname === "/connect" || url.pathname === "/update")) {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const isConnect = url.pathname === "/connect";
      if (isConnect) hits.connect += 1;
      else hits.update += 1;
      const body = JSON.parse(raw || "{}") as { username?: string; password?: string };
      const reply = () => {
        if (state.auth === "indisponible") return serverError();
        if (state.auth === "limite") return json(429, JSON.stringify({ message: "Too Many Attempts." }));
        const account = body.username ? accounts[body.username] : undefined;
        if (!isConnect) {
          if (!body.password) return json(422, fixture("auth", "update-422.json"));
          if (!account) return json(404, fixture("auth", "update-404.json"));
          account.password = body.password;
          return json(200, JSON.stringify({ user: { username: body.username, joueur: account.joueur }, message: "Mot de passe mis à jour" }));
        }
        if (!body.username) return json(422, fixture("auth", "connect-422.json"));
        if (!account) return json(404, fixture("auth", "connect-404.json"));
        if (account.password === null) return json(201, fixture("auth", "connect-201.json"));
        if (!body.password) return json(400, fixture("auth", "connect-400.json"));
        if (body.password !== account.password) return json(401, fixture("auth", "connect-401.json"));
        return json(
          200,
          JSON.stringify({
            user: { username: body.username, joueur: account.joueur, equipe: account.joueur ? "RPB U15" : null },
            token: `e2e|${body.username}`,
            message: "Connexion réussie",
          }),
        );
      };
      if (state.auth === "lent") setTimeout(reply, 1500);
      else reply();
    });
    return;
  }

  // Back protégé (B1) qui refuse le jeton : toute route de données authentifiée répond 401.
  if (state.session401 && req.headers.authorization) {
    return json(401, JSON.stringify({ message: "Unauthenticated." }));
  }

  const logsRoute = req.method === "GET" ? url.pathname.match(/^\/api\/logs\/(errors|requests)$/) : null;
  if (logsRoute) {
    const kind = logsRoute[1] as "errors" | "requests";
    logQueries.push({
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(Object.entries(req.headers).map(([name, value]) => [name, String(value)])),
    });
    // `GET /api/logs/requests` n'est pas routée dans le back du 12/10/2026 (B-LOG-1).
    if (kind === "requests" && state.logsBack === "actuel") return json(404, fixture("admin-logs", "requests-404.json"));
    if (state.logs === "error") return serverError();
    const reply = () => {
      if (state.logs === "empty") return json(200, fixture("admin-logs", "errors-empty.json"));
      if (state.logs === "hostile") return json(200, fixture("admin-logs", "errors-hostile.json"));
      if (state.logs === "invalid") return json(200, fixture("admin-logs", "errors-invalid-source.json"));
      return json(200, JSON.stringify(paginateLogs(kind, url.searchParams)));
    };
    if (state.logs === "slow") setTimeout(reply, 1500);
    else reply();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/saisons") {
    hits.adminReads += 1;
    if (state.adminSeason === "error") return serverError();
    return json(200, JSON.stringify(seasons));
  }
  // Une saison et ses participants : `{ saison, participer: [{ licence }, …] }` (join sans DISTINCT : doublons possibles).
  const seasonDetail = req.method === "GET" ? url.pathname.match(/^\/api\/saisons\/(\d+)$/) : null;
  if (seasonDetail) {
    hits.adminReads += 1;
    if (state.adminSeason === "error") return serverError();
    const season = seasons.find((candidate) => String(seasonId(candidate)) === seasonDetail[1]);
    if (!season) return json(404, fixture("admin-season", "season-show-404.json"));
    const participer = (seasonParticipants[seasonId(season)] ?? []).map((licence) => ({ licence }));
    return json(200, JSON.stringify({ saison: season, participer }));
  }
  const playerSeasons = url.pathname.match(/^\/saisons\/([^/]+)$/);
  if (playerSeasons && createdLicences.has(decodeURIComponent(playerSeasons[1]))) {
    // Joueur créé pendant le scénario : uniquement les saisons où il a été inscrit (doublons possibles, comme `participer`).
    const all = JSON.parse(fixture("home", "saisons-admin.json")) as { Id_Saison: number }[];
    const enrolled = enrollments[decodeURIComponent(playerSeasons[1])] ?? [];
    return json(200, JSON.stringify(enrolled.flatMap((id) => all.filter((season) => season.Id_Saison === id))));
  }
  if (playerSeasons && touchedLicences.has(decodeURIComponent(playerSeasons[1]))) {
    // Inscriptions modifiées par l'administration des saisons : les saisons suivent les participants.
    const licence = decodeURIComponent(playerSeasons[1]);
    return json(200, JSON.stringify(seasons.filter((season) => (seasonParticipants[seasonId(season)] ?? []).includes(licence))));
  }
  if (playerSeasons && playerSeasons[1] !== "LIC1000") {
    const file = PLAYER_SEASONS[playerSeasons[1]];
    return json(200, file ? fixture("player", file) : fixture("player", "saisons-joueur-LIC4000.json"));
  }
  if (/^\/saisons\/[^/]+$/.test(url.pathname)) {
    return json(
      200,
      state.saisonsJoueur === "vide" ? fixture("calendar", "saisons-joueur-vide.json") : fixture("home", "saisons-joueur.json"),
    );
  }

  // Liste des équipes (administration) : tableau nu, sans tri.
  if (req.method === "GET" && url.pathname === "/api/equipes") {
    hits.adminReads += 1;
    if (state.equipes === "error") return serverError();
    const reply = () => json(200, JSON.stringify(teams));
    if (state.equipes === "lent") setTimeout(reply, 1500);
    else reply();
    return;
  }

  // Une équipe : l'accueil et le calendrier lisent `/api/equipes/1`, l'administration lit les autres.
  const teamDetail = url.pathname.match(/^\/api\/equipes\/([^/]+)$/);
  if (req.method === "GET" && teamDetail) {
    const id = teamDetail[1];
    if (id === "1") hits.equipes += 1;
    else hits.adminReads += 1;
    if (state.equipe === "error" && id === "1") return serverError();
    if (state.equipes === "error") return serverError();
    // PostgreSQL répond 500 sur un identifiant non numérique (fixture reconstruite, B-T7).
    if (!/^\d+$/.test(id)) return serverError();
    const team = teams.find((candidate) => String(candidate.Id_Equipe) === id);
    return team ? json(200, JSON.stringify(team)) : json(404, fixture("admin-team", "equipe-404.json"));
  }

  if (req.method === "GET" && url.pathname === "/api/users") {
    hits.adminReads += 1;
    if (state.users === "error") return serverError();
    // Liste en 1,5 s : le squelette reste visible.
    if (state.users === "lent") return void setTimeout(() => json(200, JSON.stringify({ users: userRecords })), 1500);
    return json(200, JSON.stringify({ users: userRecords }));
  }

  if (url.pathname === "/api/saisons/4/joueurs") {
    if (state.joueurs === "error") return serverError();
    const file = { ok: "saison-joueurs.json", doublon: "saison-joueurs-doublon.json", vide: "saison-joueurs-vide.json" }[state.joueurs];
    return json(200, fixture("player", file));
  }
  if (/^\/api\/saisons\/\d+\/joueurs$/.test(url.pathname)) return json(200, fixture("player", "saison-joueurs-vide.json"));
  if (req.method === "GET" && url.pathname === "/api/joueurs") {
    hits.adminReads += 1;
    return state.joueurs === "error" || state.adminPlayer === "error" ? serverError() : json(200, JSON.stringify({ joueurs: players }));
  }

  const playerDetail = req.method === "GET" ? url.pathname.match(/^\/api\/joueurs\/([^/]+)$/) : null;
  if (playerDetail) {
    hits.joueur += 1;
    const licence = decodeURIComponent(playerDetail[1]);
    // Un joueur absent du magasin (supprimé, jamais créé) n'existe pas.
    const record = players.find((candidate) => candidate.licence === licence);
    if (!record) return json(404, fixture("player", "joueur-404.json"));
    // Fiche des fixtures (stats, examens) ; si le joueur a été modifié, son identité vient du magasin.
    const withStore = (payload: string) => {
      if (!modifiedLicences.has(licence)) return payload;
      const parsed = JSON.parse(payload) as { joueur: Record<string, unknown> };
      return JSON.stringify({ ...parsed, joueur: { ...parsed.joueur, ...record } });
    };
    if (licence === "LIC1000") {
      if (state.joueur === "error") return serverError();
      const file = { nominal: "joueur-complet.json", doublon: "joueur-doublon.json", "stats-invalides": "joueur-stats-invalides.json", "examens-invalides": "joueur-examens-invalides.json" }[state.joueur];
      return json(200, withStore(fixture("player", file)));
    }
    if (licence === "LIC2000") {
      if (state.coequipier === "saison-sans-stats") {
        // Des lignes de la seule saison 1 : inscrit en saison 4, sans aucune stat sur cette saison.
        const payload = JSON.parse(fixture("player", "joueur-hors-inscription.json")) as { stats: { Id_Saison: number }[] };
        payload.stats = payload.stats.filter((line) => line.Id_Saison === 1);
        return json(200, withStore(JSON.stringify(payload)));
      }
      return json(200, withStore(fixture("player", state.coequipier === "hors-inscription" ? "joueur-hors-inscription.json" : "joueur-coequipier.json")));
    }
    const file = PLAYER_DETAIL_FILES[licence];
    if (file) return json(200, withStore(fixture("player", file)));
    // Autre joueur du magasin (ou créé pendant le scénario) : fiche sans stat ni examen.
    return json(200, JSON.stringify({ joueur: record, stats: [], examens: [] }));
  }

  const physics = url.pathname.match(/^\/physics\/([^/]+)$/);
  if (physics) {
    if (state.physics === "error") return serverError();
    // Seul LIC1000 a des mesures dans les fixtures.
    const base = physics[1] === "LIC1000" ? (JSON.parse(fixture("player", PHYSICS_FILES[state.physics])) as unknown[]) : [];
    return json(200, JSON.stringify(physics[1] === "LIC1000" ? [...base, ...createdPhysics] : base));
  }
  if (req.method === "POST" && url.pathname === "/api/physics") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (state.physicsPost === "error") return serverError();
      if (state.physicsPost === "422") return json(422, fixture("player", "physics-422.json"));
      const body = JSON.parse(raw) as { type: string; value: number; date_physics: string };
      const created = { id: `00000000-0000-4000-8000-${String(createdPhysics.length + 1).padStart(12, "0")}`, type: body.type, value: body.value, date_physics: body.date_physics };
      createdPhysics.push(created);
      json(201, JSON.stringify(created));
    });
    return;
  }

  // Écritures d'administration (scénario `adminWrite`) : journalisées, puis appliquées au magasin en mémoire ou refusées.
  if (["POST", "PUT", "DELETE"].includes(req.method ?? "") && url.pathname.startsWith("/api/")) {
    void readBody(req).then((raw) => {
      let body: unknown;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        body = raw;
      }
      writes.push({ method: req.method ?? "", path: url.pathname, body, authorization: req.headers.authorization ?? null });
      const reply = () => answerWrite(req.method ?? "", url.pathname, body, json);
      if (state.adminWrite === "slow") setTimeout(reply, 1500);
      else reply();
    });
    return;
  }

  // Matchs joués sans aucune ligne de stats (déclaré AVANT `/api/matchs/{id}`, comme dans `routes/api.php`).
  if (req.method === "GET" && url.pathname === "/api/matchs/review") {
    hits.adminReads += 1;
    if (state.matchsReview === "error") return serverError();
    if (state.matchsReview === "vide") return json(200, fixture("admin-game", "matchs-review-vide.json"));
    if (state.matchsReview === "format-invalide") return json(200, fixture("admin-game", "matchs-review-invalide.json"));
    const awaiting = games.filter((game) => (game.scoreDom !== 0 || game.scoreExt !== 0) && !gamesWithStats.has(game.idMatch));
    return json(200, JSON.stringify(awaiting.map((game) => ({ ...toGameListEntry(game), video: game.video }))));
  }

  const gameDetail = url.pathname.match(/^\/api\/matchs\/([^/]+)$/);
  if (gameDetail && state.adminGame === "ok") {
    hits.match += 1;
    return answerGameDetail(gameDetail[1], json, serverError);
  }
  if (gameDetail) {
    hits.match += 1;
    const id = gameDetail[1];
    // Le vrai back (PostgreSQL) répond 500 sur un identifiant non numérique.
    if (state.match === "error" || !/^\d+$/.test(id)) return serverError();
    if (id === UNKNOWN_GAME_ID) return json(404, fixture("game-detail", "match-404.json"));
    const payload = JSON.parse(withRelativeDates(fixture("game-detail", `match-${state.match}.json`)));
    payload.match.idMatch = Number(id);
    return json(200, JSON.stringify(payload));
  }

  if (url.pathname === "/api/history") {
    hits.history += 1;
    if (state.historique === "error") return serverError();
    const file = state.historique === "valeurs-chaine" ? "history-valeurs-chaine.json" : `history-${state.historique}.json`;
    return json(200, fixture("hall-of-fame", file));
  }

  if (url.pathname === "/api/matchs") {
    hits.matchs += 1;
    if (state.matchs === "error") return serverError();
    // Cascade `matchs.Id_Saison` : les matchs d'une saison supprimée disparaissent.
    return json(200, JSON.stringify(games.filter((game) => !deletedSeasonIds.has(game.idSaison)).map(toGameListEntry)));
  }

  const accueil = url.pathname.match(/^\/accueil\/(\d+)$/);
  if (accueil) {
    hits.accueil += 1;
    if (state.accueil === "error") return serverError();
    if (accueil[1] === "1" && state.accueil === "en-cours") return json(200, fixture("home", "accueil-saison-passee.json"));
    return json(200, fixture("home", `accueil-${state.accueil}.json`));
  }

  json(404, JSON.stringify({ message: "Not found" }));
});

server.listen(PORT, () => {
  process.stdout.write(`Mock API prête sur http://localhost:${PORT}\n`);
});
