import type { BrowserContext } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "../../lib/sessionCookie";
import { signSessionToken } from "../../lib/sessionToken";

export const APP_URL = "http://localhost:3100";
export const MOCK_API_URL = "http://localhost:4010";
export const E2E_SESSION_SECRET = "e2e-secret-e2e-secret-e2e-secret-0123456";

export type Scenario = "en-cours" | "debut-saison" | "fin-saison" | "saison-vide" | "error";

export async function setScenario(accueil: Scenario): Promise<void> {
  const res = await fetch(`${MOCK_API_URL}/__scenario`, { method: "POST", body: JSON.stringify({ accueil }) });
  if (!res.ok) throw new Error(`Impossible de changer de scénario : ${res.status}`);
}

export type CalendarScenario = {
  matchs?: "nominal" | "fin-saison" | "vide" | "error";
  equipe?: "ok" | "error";
  saisons?: "admin" | "sans-equipe";
  saisonsJoueur?: "ok" | "vide";
};

/** Tout ce qui n'est pas précisé revient à l'état par défaut du faux back. */
export async function setCalendarScenario(scenario: CalendarScenario = {}): Promise<void> {
  const res = await fetch(`${MOCK_API_URL}/__scenario`, { method: "POST", body: JSON.stringify(scenario) });
  if (!res.ok) throw new Error(`Impossible de changer de scénario : ${res.status}`);
}

export type GameDetailScenario =
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

/** Scénario de la fiche match ; le reste revient à l'état par défaut (saisons, joueur…) sauf s'il est précisé. */
export async function setGameDetailScenario(match: GameDetailScenario, rest: CalendarScenario = {}): Promise<void> {
  const res = await fetch(`${MOCK_API_URL}/__scenario`, { method: "POST", body: JSON.stringify({ ...rest, match }) });
  if (!res.ok) throw new Error(`Impossible de changer de scénario : ${res.status}`);
}

export type PlayerScenario = CalendarScenario & {
  joueurs?: "ok" | "vide" | "doublon" | "error";
  joueur?: "nominal" | "doublon" | "stats-invalides" | "examens-invalides" | "error";
  coequipier?: "nominal" | "hors-inscription" | "saison-sans-stats";
  physics?: "ok" | "type-inconnu" | "vide" | "mysql" | "error";
  physicsPost?: "created" | "422" | "error";
};

/** Scénario des pages joueurs ; tout ce qui n'est pas précisé revient à l'état par défaut du faux back. */
export async function setPlayerScenario(scenario: PlayerScenario = {}): Promise<void> {
  const res = await fetch(`${MOCK_API_URL}/__scenario`, { method: "POST", body: JSON.stringify(scenario) });
  if (!res.ok) throw new Error(`Impossible de changer de scénario : ${res.status}`);
}

export type HallOfFameScenario =
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

/** Scénario du palmarès (`GET /api/history`) ; le reste revient à l'état par défaut du faux back. */
export async function setHallOfFameScenario(historique: HallOfFameScenario): Promise<void> {
  const res = await fetch(`${MOCK_API_URL}/__scenario`, { method: "POST", body: JSON.stringify({ historique }) });
  if (!res.ok) throw new Error(`Impossible de changer de scénario : ${res.status}`);
}

export type AuthScenario = {
  auth?: "ok" | "indisponible" | "limite" | "lent";
  session401?: boolean;
  matchs?: CalendarScenario["matchs"];
  accueil?: Scenario;
};

/** Scénario d'authentification ; le reste (et les mots de passe des comptes) revient à l'état par défaut. */
export async function setAuthScenario(scenario: AuthScenario = {}): Promise<void> {
  const res = await fetch(`${MOCK_API_URL}/__scenario`, { method: "POST", body: JSON.stringify(scenario) });
  if (!res.ok) throw new Error(`Impossible de changer de scénario : ${res.status}`);
}

export type Hits = {
  accueil: number;
  matchs: number;
  equipes: number;
  match: number;
  joueur: number;
  history: number;
  connect: number;
  update: number;
  csrf: number;
  /** Lectures d'administration : /api/equipes (hors /1), /api/users, /api/saisons, /api/joueurs. */
  adminReads: number;
};

export async function getHits(): Promise<Hits> {
  const res = await fetch(`${MOCK_API_URL}/__hits`);
  return (await res.json()) as Hits;
}

export type AdminScenario = {
  adminWrite?: "ok" | "422" | "404" | "404-season" | "404-team" | "error" | "slow";
  equipes?: "ok" | "vide" | "error" | "lent";
  users?: "ok" | "error" | "chaines" | "vide" | "historiques" | "invalide" | "lent";
  joueurs?: "ok" | "vide" | "doublon" | "error";
  saisons?: "admin" | "sans-equipe";
  matchs?: "nominal" | "fin-saison" | "vide" | "error";
  /** Joueurs : magasin nominal, vide, réparti sur trois équipes, liste en 500, création sans compte, aucune saison. */
  adminPlayer?: "ok" | "vide" | "multi-equipes" | "error" | "sans-compte" | "sans-saison";
  /** Fiche match (`GET /api/matchs/{id}`) : `error` rend illisible le comptage des lignes de stats. */
  match?: GameDetailScenario;
  /** Saisons : magasin nominal (2 saisons), aucune, 5 saisons (`admin-season/seasons-list-200.json`), lecture en 500. */
  adminSeason?: "ok" | "vide" | "multi" | "error";
  /** Matchs : `ok` = la fiche `GET /api/matchs/{id}` lit le magasin de matchs en mémoire (édition, suppression, revalidation). */
  adminGame?: "off" | "ok";
  /** `GET /api/matchs/review` : dérivé du magasin (match 48 à saisir), aucune ligne, 500, corps inattendu. */
  matchsReview?: "ok" | "vide" | "error" | "format-invalide";
  /** Lignes de stats du match lu avec `adminGame: "ok"` : selon le magasin, 10 lignes, aucune, illisibles, 500. */
  matchsStats?: "auto" | "avec" | "sans" | "inconnu" | "erreur";
  physics?: "ok" | "type-inconnu" | "vide" | "mysql" | "error";
  joueur?: "nominal" | "doublon" | "stats-invalides" | "examens-invalides" | "error";
  /** Journaux : jeu de 134 erreurs paginé et filtré, aucune ligne, contenu hostile, source invalide, 500, réponse lente. */
  logs?: "page" | "empty" | "hostile" | "invalid" | "error" | "slow";
  /** `livre` : B-LOG-1 à B-LOG-4 livrés (requêtes servies, tous les filtres appliqués) ; `actuel` : le back du 12/10/2026. */
  logsBack?: "actuel" | "livre";
};

/**
 * Scénario de l'administration. Tout ce qui n'est pas précisé revient à l'état par défaut du faux back ; les magasins
 * d'équipes, de joueurs et de comptes et le journal des écritures (`/__writes`) sont réinitialisés.
 */
export async function setAdminScenario(scenario: AdminScenario = {}): Promise<void> {
  const res = await fetch(`${MOCK_API_URL}/__scenario`, { method: "POST", body: JSON.stringify(scenario) });
  if (!res.ok) throw new Error(`Impossible de changer de scénario : ${res.status}`);
}

export type RecordedWrite = { method: string; path: string; body: unknown; authorization: string | null };

/** Écritures (POST / PUT / DELETE sur /api/*) reçues par le faux back depuis le dernier changement de scénario. */
export async function getWrites(): Promise<RecordedWrite[]> {
  const res = await fetch(`${MOCK_API_URL}/__writes`);
  return (await res.json()) as RecordedWrite[];
}

export async function getAccueilHits(): Promise<number> {
  return (await getHits()).accueil;
}

/**
 * Pose un cookie de session signé : compte `admin` sans licence (seul admin, D1), joueur avec licence (LIC1000 par
 * défaut), ou compte sans joueur (`orphan` : joueur sans licence).
 */
export async function loginAs(
  context: BrowserContext,
  role: "admin" | "player" | "orphan",
  licence = "LIC1000",
): Promise<void> {
  const payload = {
    admin: { username: "admin", licence: null, token: "e2e" },
    player: { username: "lucas", licence, token: "e2e" },
    orphan: { username: "jean.dupont", licence: null, token: "e2e" },
  }[role];
  const value = await signSessionToken(payload, E2E_SESSION_SECRET);
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value, url: APP_URL }]);
}

export type RecordedLogQuery = { path: string; query: Record<string, string>; headers: Record<string, string> };

/** Appels reçus par `/api/logs/*` depuis le dernier changement de scénario, dans l'ordre. */
export async function getLogQueries(): Promise<RecordedLogQuery[]> {
  const res = await fetch(`${MOCK_API_URL}/__log-queries`);
  return (await res.json()) as RecordedLogQuery[];
}

/** URL du second serveur de l'application, démarré avec `NODE_ENV=test` et `LOG_BACK_SUPPORT_OVERRIDE=all` (back livré). */
export const APP_URL_BACK_DELIVERED = "http://localhost:3101";
