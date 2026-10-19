import { expect, test, type Page } from "@playwright/test";
import { loginAs, setPlayerScenario } from "./helpers";

/*
 * LIC1000, saison 4 (2025-2026 · D1 · U15G) : 13 matchs, journées 1 à 13 dans l'ordre chronologique.
 * Journée 1 : FAC Basket (domicile) 53 – 34 Coq Carlanais Basket. Journée 2 : Pibracaise 54 – 57 FAC Basket (extérieur).
 */
const STATS = "/player/LIC1000?saison=4";
const CAPTION = "Statistiques match par match, 2025-2026 · D1 · U15G, match complet";

const log = (page: Page) => page.getByRole("table", { name: /^Statistiques match par match/ });
const rows = (page: Page) => log(page).locator("tbody tr");
const selector = (page: Page) => page.getByLabel("Saison", { exact: true });

test.beforeEach(async () => {
  await setPlayerScenario();
});

test.describe("Match par match", () => {
  test("une ligne par match, dans l'ordre chronologique, avec légende accessible", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    await expect(log(page)).toHaveAccessibleName(CAPTION);
    await expect(rows(page)).toHaveCount(13);
    const journees = await rows(page).locator("th").allTextContents();
    const numbers = journees.map((text) => Number(/Journée (\d+)/.exec(text)![1]));
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  test("adversaire, lieu, résultat et score (celui du RPB d'abord)", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    const home = rows(page).nth(0);
    await expect(home).toContainText("Coq Carlanais Basket");
    await expect(home).toContainText("À domicile");
    await expect(home).toContainText("Victoire");
    await expect(home).toContainText("53 – 34");
    const away = rows(page).nth(1);
    await expect(away).toContainText("Union Sportive Pibracaise");
    await expect(away).toContainText("À l'extérieur");
    await expect(away).toContainText("57 – 54");
  });

  test("le lien de la date a un nom complet et mène à la fiche du match (P13)", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    const link = rows(page).nth(0).getByRole("link");
    await expect(link).toHaveAccessibleName(/^Match du \d{2}\/\d{2}\/\d{4} contre Coq Carlanais Basket$/);
    await expect(link).toHaveAttribute("href", "/game/36");
    await link.click();
    await expect(page).toHaveURL(/\/game\/36$/);
  });

  test("pied du tableau : moyenne par match et total", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    await expect(log(page).locator("tfoot").getByRole("rowheader")).toHaveText(["Moyenne par match", "Total"]);
    await expect(log(page).locator("tfoot tr").first()).toContainText(/\d+,\d\s%/);
  });

  test("un match saisi en double n'apparaît qu'une fois, avec un badge", async ({ page, context }) => {
    await setPlayerScenario({ joueur: "doublon" });
    await loginAs(context, "player");
    await page.goto(STATS);
    await expect(rows(page)).toHaveCount(13);
    await expect(log(page).getByText("Doublon")).toHaveCount(1);
  });
});

test.describe("Filtre par période", () => {
  test("Q3 : Minutes masquée, URL mise à jour sans entrée d'historique, conservé au rechargement", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    const minutes = log(page).getByRole("columnheader", { name: /^Minutes jouées/ });
    await expect(minutes).toBeVisible();
    const historyLength = await page.evaluate(() => history.length);
    await page.getByRole("button", { name: "Quart-temps 3" }).click();
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=4&periode=q3$/);
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    await expect(log(page)).toHaveAccessibleName("Statistiques match par match, 2025-2026 · D1 · U15G, quart-temps 3");
    await expect(minutes).toHaveCount(0);
    await expect(page.getByText("Minutes : total du match, visibles avec « Tout ».")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Quart-temps 3" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Tout" }).click();
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=4$/);
  });
});

test.describe("Sélection de saison (P9, P10)", () => {
  test("carrière : toutes les lignes, libellé explicite", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    await selector(page).selectOption({ label: "Carrière" });
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=carriere$/);
    await expect(rows(page)).toHaveCount(27);
    await expect(log(page)).toHaveAccessibleName("Statistiques match par match, Carrière (toutes les saisons), match complet");
  });

  test("saison précédente, puis retour à l'effectif sur cette saison", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    await selector(page).selectOption({ label: "2024-2025 · D3 · U15G" });
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=1$/);
    await expect(rows(page)).toHaveCount(14);
    await page.getByRole("link", { name: "Retour à l'effectif" }).click();
    await expect(page).toHaveURL(/\/player\?saison=1$/);
  });

  test("la saison choisie est conservée en changeant d'onglet", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/player/LIC1000?saison=1");
    await page.getByRole("navigation", { name: "Sections de la fiche" }).getByRole("link", { name: "Examens" }).click();
    await expect(page).toHaveURL(/\/player\/LIC1000\?saison=1&onglet=examens$/);
  });

  test("saison sans stats : message explicite et lien vers la carrière", async ({ page, context }) => {
    await setPlayerScenario({ coequipier: "saison-sans-stats" });
    await loginAs(context, "admin");
    await page.goto("/player/LIC2000?saison=4");
    await expect(page.getByText("Aucune statistique sur la saison 2025-2026 · D1 · U15G.")).toBeVisible();
    await page.getByRole("link", { name: "Voir sa carrière" }).click();
    await expect(page).toHaveURL(/\/player\/LIC2000\?saison=carriere$/);
    await expect(rows(page)).toHaveCount(3);
  });
});

test.describe("Saisons hors inscription (Q5, Q3)", () => {
  test("l'admin voit les saisons où le joueur a des stats sans y être inscrit", async ({ page, context }) => {
    await setPlayerScenario({ coequipier: "hors-inscription" });
    await loginAs(context, "admin");
    await page.goto("/player/LIC2000?saison=4");
    const identity = page.getByRole("region", { name: "Élodie ROUSSEL" });
    await expect(identity.getByText("2025-2026 · D1 · U15G")).toBeVisible();
    await expect(identity.getByText("2024-2025 · D3 · U15G")).toBeVisible();
  });

  test("un coéquipier ne voit que les saisons qu'il partage", async ({ page, context }) => {
    await setPlayerScenario({ coequipier: "hors-inscription" });
    await loginAs(context, "player", "LIC4000");
    await page.goto("/player/LIC2000?saison=4");
    const identity = page.getByRole("region", { name: "Élodie ROUSSEL" });
    await expect(identity.getByText("2025-2026 · D1 · U15G")).toBeVisible();
    await expect(identity.getByText("2024-2025 · D3 · U15G")).toHaveCount(0);
    await expect(selector(page).locator("option")).toHaveText(["2025-2026 · D1 · U15G", "Carrière"]);
  });
});

test.describe("Moyennes et réussite aux tirs", () => {
  test("moyennes par quart-temps : histogramme décoratif et tableau complet", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    const card = page.getByRole("region", { name: "Moyennes par quart-temps" });
    await expect(card.getByText("Par match · 2025-2026 · D1 · U15G")).toBeVisible();
    const table = card.getByRole("table", { name: "Toutes les statistiques" });
    await expect(table.getByRole("columnheader")).toHaveCount(6);
    await expect(table.getByRole("rowheader")).toHaveCount(7);
    await expect(card.getByText(/pts \/ match/)).toBeVisible();
  });

  test("réussite aux tirs : quatre tuiles", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(STATS);
    const card = page.getByRole("region", { name: "Réussite aux tirs" });
    await expect(card.getByRole("heading", { level: 3 })).toHaveText([
      "Tirs à 2 pts",
      "Tirs à 3 pts",
      "Lancers francs",
      "Tous les tirs (2 + 3 pts)",
    ]);
  });
});

test.describe("Mise en page", () => {
  test("à 390 px, la page ne défile pas ; le journal défile dans sa boîte", async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await loginAs(context, "player");
    await page.goto(STATS);
    await expect(rows(page)).toHaveCount(13);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const box = page.getByRole("region", { name: CAPTION });
    expect(await box.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await expect(page.getByText("Fais défiler le tableau vers la droite pour voir toutes les colonnes.")).toBeVisible();
  });

  test("à 1280 px, toutes les colonnes tiennent sans aide au défilement", async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(context, "player");
    await page.goto(STATS);
    await expect(rows(page)).toHaveCount(13);
    await expect(page.getByText("Fais défiler le tableau vers la droite pour voir toutes les colonnes.")).toBeHidden();
    const box = page.getByRole("region", { name: CAPTION });
    expect(await box.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  });
});
