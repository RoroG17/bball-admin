import { expect, test } from "@playwright/test";
import { getAccueilHits, loginAs, setScenario } from "./helpers";

test.beforeEach(async () => {
  await setScenario("en-cours");
});

test.describe("Saison affichée", () => {
  test("sans paramètre, redirige vers la saison la plus récente", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/");
    await expect(page).toHaveURL(/\/\?saison=4$/);
    await expect(page.getByLabel("Saison affichée")).toHaveValue("4");
    await expect(page.getByText("Saison 2025-2026 · D1 · U15G")).toBeVisible();
  });

  test("changer de saison met à jour l'URL, et un rechargement la conserve", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/?saison=4");
    await page.getByLabel("Saison affichée").selectOption("1");
    await expect(page).toHaveURL(/\/\?saison=1$/);
    await expect(page.getByText("Saison 2024-2025 · D3 · U15G")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Saison affichée")).toHaveValue("1");
    await expect(page.getByText("Saison 2024-2025 · D3 · U15G")).toBeVisible();
  });

  test("un joueur qui force une saison hors de son périmètre est redirigé", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/?saison=999");
    await expect(page).toHaveURL(/\/\?saison=4$/);
  });

  test("sans session, redirige vers la connexion", async ({ page }) => {
    await page.goto("/?saison=4");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });
});

test.describe("Matchs", () => {
  test("début de saison : le match suivant s'affiche malgré l'absence de match joué", async ({ page, context }) => {
    await setScenario("debut-saison");
    await loginAs(context, "admin");
    await page.goto("/?saison=4");
    await expect(page.getByRole("link", { name: /^Prochain match/ })).toBeVisible();
    await expect(page.getByText("Aucun match joué pour l'instant")).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  });

  test("fin de saison : le dernier match s'affiche, pas de match à venir", async ({ page, context }) => {
    await setScenario("fin-saison");
    await loginAs(context, "admin");
    await page.goto("/?saison=4");
    await expect(page.getByRole("link", { name: /^Dernier match/ })).toBeVisible();
    await expect(page.getByText("Aucun match à venir")).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  });

  test("le match à venir n'a pas de score, le match joué affiche son résultat", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/?saison=4");
    const upcoming = page.getByRole("link", { name: /^Prochain match/ });
    await expect(upcoming).toContainText("VS");
    await expect(upcoming).not.toContainText(/\b0\s*[-–]\s*0\b/);
    await expect(upcoming.locator(".text-\\[40px\\]")).toHaveCount(0);

    const played = page.getByRole("link", { name: /^Dernier match/ });
    await expect(played).toContainText("Défaite");
    await expect(played).toHaveAttribute("aria-label", /FAC Basket 69, OTB 72, défaite/);
  });
});

test("le bilan affiche victoires, défaites et pourcentage", async ({ page, context }) => {
  await loginAs(context, "admin");
  await page.goto("/?saison=4");
  const record = page.getByRole("region", { name: "Bilan de la saison" });
  await expect(record).toContainText("11 V – 7 D");
  await expect(record).toContainText("61 % de victoires sur 18 matchs");
});

test("classements : les ex æquo partagent leur rang, une ligne mène à la fiche joueur", async ({ page, context }) => {
  await loginAs(context, "admin");
  await page.goto("/?saison=4");
  const turnovers = page.getByRole("region", { name: "Ballons perdus" });
  await expect(turnovers.getByText("ex æquo")).toHaveCount(2);
  await expect(turnovers.locator("ol").first().locator("li").nth(1)).toContainText("Rang 1");

  const points = page.getByRole("region", { name: "Points", exact: true });
  const firstRow = points.locator("ol").first().getByRole("link").first();
  await firstRow.click();
  await expect(page).toHaveURL(/\/player\/LIC\d+$/);
});

test("une erreur du back n'affecte que les blocs, qui peuvent être rechargés", async ({ page, context }) => {
  await setScenario("error");
  await loginAs(context, "admin");
  await page.goto("/?saison=4");
  await expect(page.getByText("Impossible de charger ce bloc").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();

  await setScenario("en-cours");
  await page
    .getByRole("alert")
    .filter({ hasText: "Bilan de la saison" })
    .getByRole("button", { name: "Réessayer" })
    .click();
  await expect(page.getByRole("region", { name: "Bilan de la saison" })).toContainText("11 V – 7 D");
});

test("un seul appel à /accueil pour toute la page", async ({ page, context }) => {
  await loginAs(context, "admin");
  await setScenario("en-cours");
  await page.goto("/?saison=4");
  await expect(page.getByRole("region", { name: "Bilan de la saison" })).toContainText("11 V – 7 D");
  expect(await getAccueilHits()).toBe(1);
});

test("pas de défilement horizontal à 400 px", async ({ page, context }) => {
  await page.setViewportSize({ width: 400, height: 900 });
  await loginAs(context, "admin");
  await page.goto("/?saison=4");
  await expect(page.getByRole("heading", { name: "Classements de la saison" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
});

test.describe("Raccourci admin", () => {
  test("visible pour un admin quand un match est à venir", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/?saison=4");
    const shortcut = page.getByRole("link", { name: /Saisir les stats du match/ });
    await expect(shortcut).toBeVisible();
    await expect(shortcut).toHaveAttribute("href", "/game/54/stat");
  });

  test("absent pour un joueur", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/?saison=4");
    await expect(page.getByRole("link", { name: /^Prochain match/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Saisir les stats du match/ })).toHaveCount(0);
  });
});
