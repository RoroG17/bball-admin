import { expect, test, type Page } from "@playwright/test";
import { loginAs, setPlayerScenario } from "./helpers";

/*
 * Fixtures `tests/fixtures/player/` : 12 joueurs inscrits sur la saison 4 (D1 · U15G), 18 joueurs en tout.
 * LIC1000 = Lucas MARCHAND (session « joueur » des tests), LIC2000 = Élodie ROUSSEL.
 */
const LIST_URL = "/player?saison=4";
const SORTED = [
  "Maël CHEVALIER",
  "Hugo FAURE",
  "Louis FOURNIER",
  "Nathan GIRARD",
  "Gabin LAMBERT",
  "Tom LEFEBVRE",
  "Lucas MARCHAND",
  "Noah MERCIER",
  "Timéo ROBIN",
  "Élodie ROUSSEL",
  "Jules ROUX",
  "Sacha VINCENT",
];

const cards = (page: Page) => page.getByRole("region", { name: "Effectif" }).getByRole("listitem");
const selector = (page: Page) => page.getByLabel("Saison affichée");

test.beforeEach(async () => {
  await setPlayerScenario();
});

test.describe("Liste", () => {
  test("titre, saison, effectif trié par nom et compteur", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    await expect(page.getByRole("heading", { level: 1, name: "Joueurs" })).toBeVisible();
    await expect(page.getByText("Saison 2025-2026 · D1 · U15G")).toBeVisible();
    await expect(page.getByRole("region", { name: "Effectif" }).getByText("12 joueurs", { exact: true })).toBeVisible();
    await expect(cards(page)).toHaveCount(12);
    await expect(cards(page).getByRole("link")).toHaveText(SORTED);
  });

  test("chaque carte est un seul lien au nom concis, vers la fiche de la saison", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    const link = page.getByRole("link", { name: "Lucas MARCHAND", exact: true });
    await expect(link).toHaveAttribute("href", "/player/LIC1000?saison=4");
    await expect(cards(page).first().getByRole("link")).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=4$/);
    await expect(page.getByRole("heading", { level: 1, name: "Lucas MARCHAND" })).toBeVisible();
  });

  test("l'URL reflète la saison affichée (absente, invalide, hors périmètre)", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/player");
    await expect(page).toHaveURL(/\/player\?saison=4$/);
    await page.goto("/player?saison=999");
    await expect(page).toHaveURL(/\/player\?saison=4$/);
    await page.goto("/player?saison=abc");
    await expect(page).toHaveURL(/\/player\?saison=4$/);
  });

  test("le menu « Joueurs » est actif", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link", { name: "Joueurs" })).toHaveAttribute("aria-current", "page");
  });

  test("aucune donnée personnelle dans la page (P2)", async ({ page, context }) => {
    await loginAs(context, "admin");
    const response = await page.goto(LIST_URL);
    const html = await response!.text();
    expect(html).not.toMatch(/naissance|birthDate|civilit/i);
    expect(html).not.toMatch(/2011-\d\d-\d\d/);
  });
});

test.describe("Périmètre selon le rôle (D2)", () => {
  test("l'admin peut afficher tous les joueurs", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    await selector(page).selectOption({ label: "Tous les joueurs" });
    await expect(page).toHaveURL(/\/player\?saison=tous$/);
    await expect(page.getByText("18 joueurs", { exact: true })).toBeVisible();
    await expect(cards(page)).toHaveCount(18);
    await expect(page.getByRole("link", { name: "Lucas MARCHAND" })).toHaveAttribute("href", "/player/LIC1000");
  });

  test("un joueur n'a pas l'option « Tous les joueurs » et y est ramené sur sa saison", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(LIST_URL);
    await expect(selector(page).locator("option")).toHaveText(["2025-2026 · D1 · U15G", "2024-2025 · D3 · U15G"]);
    await page.goto("/player?saison=tous");
    await expect(page).toHaveURL(/\/player\?saison=4$/);
    await expect(cards(page)).toHaveCount(12);
  });

  test("changer de saison recharge la liste", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    await selector(page).selectOption({ label: "2024-2025 · D3 · U15G" });
    await expect(page).toHaveURL(/\/player\?saison=1$/);
    await expect(page.getByText("Saison 2024-2025 · D3 · U15G")).toBeVisible();
    await expect(page.getByText("Aucun joueur inscrit sur cette saison")).toBeVisible();
  });

  test("un joueur sans aucune saison voit « Aucune saison disponible »", async ({ page, context }) => {
    await setPlayerScenario({ saisonsJoueur: "vide" });
    await loginAs(context, "player");
    await page.goto("/player");
    await expect(page.getByText("Aucune saison disponible")).toBeVisible();
    await expect(page.getByText("Tu n'es inscrit sur aucune saison pour le moment.")).toBeVisible();
  });
});

test.describe("Recherche", () => {
  test("filtre instantanément, sans accents, sans toucher à l'URL", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    const field = page.getByRole("searchbox", { name: "Rechercher un joueur" });
    await field.fill("elodie");
    await expect(cards(page)).toHaveCount(1);
    await expect(page.getByText("1 joueur affiché", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/player\?saison=4$/);
    await field.fill("march");
    await expect(cards(page).getByRole("link")).toHaveText(["Lucas MARCHAND"]);
  });

  test("aucun résultat, puis « Effacer » rend la liste et le focus", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    const field = page.getByRole("searchbox", { name: "Rechercher un joueur" });
    await field.fill("zzz");
    await expect(page.getByText("Aucun joueur ne correspond à « zzz ».")).toBeVisible();
    await expect(page.getByText("0 joueur affiché", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Effacer" }).click();
    await expect(cards(page)).toHaveCount(12);
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("");
  });
});

test.describe("États", () => {
  test("des inscriptions en double n'affichent qu'une carte", async ({ page, context }) => {
    await setPlayerScenario({ joueurs: "doublon" });
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    await expect(cards(page)).toHaveCount(12);
  });

  test("saison sans joueur", async ({ page, context }) => {
    await setPlayerScenario({ joueurs: "vide" });
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    await expect(page.getByText("Aucun joueur inscrit sur cette saison")).toBeVisible();
    await expect(page.getByRole("searchbox")).toHaveCount(0);
  });

  test("erreur de lecture : seul le bloc est en erreur", async ({ page, context }) => {
    await setPlayerScenario({ joueurs: "error" });
    await loginAs(context, "admin");
    await page.goto(LIST_URL);
    await expect(page.getByRole("heading", { level: 1, name: "Joueurs" })).toBeVisible();
    await expect(page.locator("section[role=alert]")).toContainText("Impossible de charger ce bloc");
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
    await expect(selector(page)).toBeVisible();
  });
});

test.describe("Mise en page", () => {
  for (const [width, columns] of [
    [1280, 4],
    [1024, 3],
    [390, 1],
  ] as const) {
    test(`${columns} carte(s) par ligne à ${width} px, sans défilement horizontal`, async ({ page, context }) => {
      await page.setViewportSize({ width, height: 900 });
      await loginAs(context, "admin");
      await page.goto(LIST_URL);
      await expect(cards(page)).toHaveCount(12);
      const lefts = await cards(page).evaluateAll((items) => [
        ...new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))),
      ]);
      expect(lefts).toHaveLength(columns);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
