import { expect, test, type Page } from "@playwright/test";
import { getHits, loginAs, setPlayerScenario } from "./helpers";

/*
 * Fixtures `tests/fixtures/player/` : LIC1000 = Lucas MARCHAND (27 lignes de stats : 14 en 2024-2025, 13 en 2025-2026 ;
 * 4 examens ; 9 mesures), LIC2000 = coéquipier inscrit en 2025-2026, LIC3000 = ancien joueur (aucune saison commune),
 * LIC4000 = sans stats. Dernier match de LIC1000 : n° 48, FAC Basket 67 – 55 Saint-Girons BB.
 */
const FICHE = "/player/LIC1000?saison=4";
const SEASON_4 = "2025-2026 · D1 · U15G";
const SEASON_1 = "2024-2025 · D3 · U15G";

const identity = (page: Page) => page.getByRole("region", { name: "Lucas MARCHAND" });
const tabs = (page: Page) => page.getByRole("navigation", { name: "Sections de la fiche" });
const counters = (page: Page) => page.getByRole("region", { name: "En chiffres" });
const adminActions = (page: Page) => page.getByRole("navigation", { name: "Actions administrateur" });

test.beforeEach(async () => {
  await setPlayerScenario();
});

test.describe("Identité et visibilité (Q1)", () => {
  test("admin : identité, infos personnelles, actions et trois onglets", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(FICHE);
    await expect(page.getByRole("heading", { level: 1, name: "Lucas MARCHAND" })).toBeVisible();
    await expect(identity(page).getByText("FAC Basket")).toBeVisible();
    await expect(identity(page).getByText(SEASON_4)).toBeVisible();
    await expect(identity(page).getByText(SEASON_1)).toBeVisible();
    await expect(identity(page).getByText("Civilité : M")).toBeVisible();
    await expect(identity(page).getByText("Né(e) le 8 février 2011")).toBeVisible();
    await expect(identity(page).getByText("Visible uniquement par le joueur et les admins.")).toBeVisible();
    await expect(adminActions(page).getByRole("link", { name: "Modifier le joueur" })).toHaveAttribute(
      "href",
      "/admin/player/LIC1000/edit",
    );
    await expect(tabs(page).getByRole("link")).toHaveText(["Statistiques", "Examens", "Physique"]);
    await expect(page.getByRole("region", { name: "Données physiques" })).toBeVisible();
  });

  test("joueur sur sa propre fiche : tout sauf les actions admin", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(FICHE);
    await expect(identity(page).getByText("Né(e) le 8 février 2011")).toBeVisible();
    await expect(adminActions(page)).toHaveCount(0);
    await expect(tabs(page).getByRole("link")).toHaveText(["Statistiques", "Examens", "Physique"]);
    await expect(page.getByRole("region", { name: "Données physiques" })).toBeVisible();
    await expect(counters(page)).toContainText("4");
    await expect(counters(page).getByText("examens", { exact: true })).toBeVisible();
  });

  test("coéquipier : ni infos personnelles, ni physique, ni examens, un seul onglet", async ({ page, context }) => {
    await loginAs(context, "player");
    const response = await page.goto("/player/LIC2000?saison=4");
    await expect(page.getByRole("heading", { level: 1, name: "Élodie ROUSSEL" })).toBeVisible();
    await expect(page.getByText("Infos personnelles")).toHaveCount(0);
    await expect(page.getByText(/Né\(e\) le/)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Données physiques" })).toHaveCount(0);
    await expect(page.getByText(/examen/i)).toHaveCount(0);
    await expect(adminActions(page)).toHaveCount(0);
    await expect(tabs(page).getByRole("link")).toHaveText(["Statistiques"]);
    await expect(tabs(page).getByRole("link", { name: "Statistiques" })).toHaveAttribute("aria-current", "page");
    const html = await response!.text();
    expect(html).not.toMatch(/naissance|birthDate|civilit|physics/i);
  });

  test("coéquipier : ?onglet=physique est ramené sur Statistiques", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/player/LIC2000?saison=4&onglet=physique");
    await expect(page).toHaveURL(/\/player\/LIC2000\?saison=4$/);
    await expect(page.getByRole("region", { name: "Match par match", exact: true })).toBeVisible();
  });

  test("le menu « Joueurs » reste actif sur une fiche", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(FICHE);
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link", { name: "Joueurs" })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("Accès et introuvable (Q3, P12)", () => {
  test("joueur sans saison commune : même page qu'un joueur inexistant", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/player/LIC3000");
    await expect(page.getByRole("heading", { level: 1, name: "Ce joueur n'existe pas" })).toBeVisible();
    await expect(page.getByText("MARCHAND")).toHaveCount(0);
  });

  test("licence inconnue (404 du back)", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/player/LIC9999");
    await expect(page.getByRole("heading", { level: 1, name: "Ce joueur n'existe pas" })).toBeVisible();
    await page.getByRole("link", { name: "Retour à l'effectif" }).click();
    await expect(page).toHaveURL(/\/player\?saison=4$/);
  });

  test("licence invalide : aucun appel au back", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/player/create-examen");
    await expect(page.getByRole("heading", { level: 1, name: "Ce joueur n'existe pas" })).toBeVisible();
    await page.goto("/player/AB%20CD");
    await expect(page.getByRole("heading", { level: 1, name: "Ce joueur n'existe pas" })).toBeVisible();
    expect((await getHits()).joueur).toBe(0);
  });

  test("l'admin ouvre un ancien joueur sans saison ni stats", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/player/LIC3000");
    await page.waitForURL(/saison=carriere$/);
    await expect(page.getByText("Aucune saison enregistrée")).toBeVisible();
    await expect(page.getByText("Aucune statistique enregistrée pour ce joueur.")).toBeVisible();
    await expect(page.getByText("Aucun match joué")).toBeVisible();
  });
});

test.describe("URL canonique (P10)", () => {
  test("saison absente, invalide ou hors périmètre → la plus récente", async ({ page, context }) => {
    await loginAs(context, "admin");
    for (const url of ["/player/LIC1000", "/player/LIC1000?saison=999", "/player/LIC1000?saison=x"]) {
      await page.goto(url);
      await expect(page).toHaveURL(/\/player\/LIC1000\?saison=4$/);
    }
  });

  test("onglet inconnu ou explicite → URL corrigée, carrière conservée", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/player/LIC1000?saison=1&onglet=statistiques");
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=1$/);
    await page.goto("/player/LIC1000?saison=carriere&onglet=nimporte");
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=carriere$/);
  });
});

test.describe("Synthèse (P5, P15)", () => {
  test("dernier match AVEC stats : score, résultat, lieu, lien vers la fiche match", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(FICHE);
    const card = page.getByRole("region", { name: "Dernier match", exact: true });
    await expect(card.getByText("FAC Basket contre Saint-Girons BB, journée 13", { exact: false })).toBeAttached();
    await expect(card.getByText("victoire 67 à 55", { exact: false })).toBeAttached();
    await expect(card.getByText("Victoire", { exact: true })).toBeVisible();
    await expect(card.getByText("À domicile")).toBeVisible();
    await expect(card.getByText(`Saison ${SEASON_4}`)).toBeVisible();
    await expect(card.getByRole("link", { name: "Voir le match" })).toHaveAttribute("href", "/game/48");
  });

  test("« Son dernier match » : valeurs comparées à la moyenne de saison, en texte", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(FICHE);
    const card = page.getByRole("region", { name: "Son dernier match", exact: true });
    for (const label of ["Points", "Rebonds", "Passes décisives", "Interceptions", "Contres", "Minutes"]) {
      await expect(card.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(card.getByText(/^Points : \d+, (au-dessus de|en dessous de|égal à) sa moyenne de saison \(/)).toBeAttached();
    await expect(card.getByText(/^moy\. /)).toHaveCount(6);
    await expect(card.getByText(`Comparé à sa moyenne sur la saison ${SEASON_4}.`)).toBeVisible();
  });

  test("compteurs liés à la sélection : 13 matchs en 2025-2026, 27 au total", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(FICHE);
    await expect(counters(page).getByText("matchs avec stats", { exact: true })).toBeVisible();
    await expect(counters(page).getByText(`${SEASON_4} · 27 au total`)).toBeVisible();
    await expect(counters(page).getByText("saisons", { exact: true })).toBeVisible();
    await page.goto("/player/LIC1000?saison=carriere");
    await expect(counters(page).getByText("Carrière (toutes les saisons)")).toBeVisible();
  });

  test("joueur sans match : « Aucun match joué », pas de carte de comparaison", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/player/LIC4000");
    await expect(page.getByText("Aucun match joué")).toBeVisible();
    await expect(page.getByText("Ses statistiques apparaîtront après son premier match.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Son dernier match", exact: true })).toHaveCount(0);
    await expect(page.getByText("Aucune statistique enregistrée pour ce joueur.")).toBeVisible();
  });

  test("les données physiques de la synthèse : dernière valeur et écart", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(FICHE);
    const card = page.getByRole("region", { name: "Données physiques" });
    await expect(card.getByText("Visible par le joueur et les admins")).toBeVisible();
    await expect(card.getByText("Taille : 172 cm le 17 juillet 2026, stable depuis le 26 mai 2026")).toBeAttached();
    await expect(card.getByText("Détente", { exact: true })).toBeVisible();
    await expect(card.getByText("VMA", { exact: true })).toBeVisible();
  });
});

test.describe("Isolation des erreurs (P4)", () => {
  test("des stats illisibles n'empêchent ni l'identité ni l'onglet Examens", async ({ page, context }) => {
    await setPlayerScenario({ joueur: "stats-invalides" });
    await loginAs(context, "admin");
    await page.goto(FICHE);
    await expect(page.getByRole("heading", { level: 1, name: "Lucas MARCHAND" })).toBeVisible();
    await expect(page.locator("section[role=alert]").first()).toContainText("Impossible de charger ce bloc");
    await expect(page.getByRole("heading", { name: "Synthèse" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Statistiques", exact: true })).toBeVisible();
    await tabs(page).getByRole("link", { name: "Examens" }).click();
    await expect(page.getByRole("region", { name: "Historique des examens" })).toBeVisible();
  });

  test("des examens illisibles ne cassent que l'onglet Examens", async ({ page, context }) => {
    await setPlayerScenario({ joueur: "examens-invalides" });
    await loginAs(context, "admin");
    await page.goto(FICHE);
    await expect(page.getByRole("region", { name: "Match par match", exact: true })).toBeVisible();
    await tabs(page).getByRole("link", { name: "Examens" }).click();
    await expect(page.locator("section[role=alert]")).toContainText("Examens");
    await expect(page.getByRole("heading", { level: 1, name: "Lucas MARCHAND" })).toBeVisible();
    await expect(tabs(page).getByRole("link", { name: "Physique" })).toBeVisible();
  });

  test("une erreur du back sur la fiche : page d'erreur sans message technique", async ({ page, context }) => {
    await setPlayerScenario({ joueur: "error" });
    await loginAs(context, "admin");
    await page.goto(FICHE);
    await expect(page.getByRole("heading", { level: 1, name: "Impossible de charger ce joueur" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Retour à l'effectif" })).toBeVisible();
    await expect(page.locator("main").getByText(/500|ApiError/)).toHaveCount(0);
  });
});
