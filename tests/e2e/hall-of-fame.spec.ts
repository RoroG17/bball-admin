import { expect, test, type Locator, type Page } from "@playwright/test";
import { getHits, loginAs, MOCK_API_URL, setHallOfFameScenario } from "./helpers";

const CARD_TITLES = [
  "Points",
  "Passes décisives",
  "Rebonds",
  "Interceptions",
  "Contres",
  "Le plus de ballons perdus",
  "% Tirs",
  "% 3 pts",
  "% lancers francs",
];
const TAB_NAMES = ["Match", "Moyenne par match", "Saison", "Moyenne par saison", "Carrière"];

const panel = (page: Page) => page.getByRole("tabpanel");
const card = (page: Page, title: string) => panel(page).getByRole("region", { name: title, exact: true });
const rows = (scope: Locator) => scope.locator("tbody tr");
const values = async (scope: Locator) => (await rows(scope).locator("td:last-child").allTextContents()).map((t) => t.trim());

test.beforeEach(async () => {
  await setHallOfFameScenario("nominal");
});

test.describe("Accès", () => {
  for (const role of ["admin", "player"] as const) {
    test(`un ${role} connecté ouvre le palmarès depuis le menu`, async ({ page, context }) => {
      await loginAs(context, role);
      await page.goto("/");
      await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Palmarès" }).click();
      await expect(page).toHaveURL(/\/hall-of-fame$/);
      await expect(page.getByRole("heading", { level: 1, name: "Palmarès" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Palmarès" })).toHaveAttribute("aria-current", "page");
    });
  }

  test("sans session, redirige vers la connexion", async ({ page }) => {
    await page.goto("/hall-of-fame");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Onglets de mode", () => {
  test("5 onglets, « Match » actif par défaut, un seul panneau visible", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(page.getByRole("tablist", { name: "Mode de classement" })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveText(TAB_NAMES);
    await expect(page.getByRole("tab", { name: "Match", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
  });

  test("se change au clavier : l'URL suit sans rechargement, le rechargement garde l'onglet", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await page.getByRole("tab", { name: "Match", exact: true }).focus();
    // Tant que la page n'est pas hydratée, la touche est sans effet : on réessaie.
    await expect(async () => {
      await page.keyboard.press("ArrowRight");
      await expect(page).toHaveURL(/\/hall-of-fame\?mode=moyenne-match$/, { timeout: 1500 });
    }).toPass();
    await expect(page.getByRole("tab", { name: "Moyenne par match", exact: true })).toBeFocused();
    expect((await getHits()).history).toBe(1);
    await page.keyboard.press("End");
    await expect(page).toHaveURL(/\?mode=carriere$/);
    await page.reload();
    await expect(page.getByRole("tab", { name: "Carrière", exact: true })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Match", exact: true }).click();
    await expect(page).toHaveURL(/\/hall-of-fame$/);
  });

  test("n'appelle pas le back au changement d'onglet", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    const before = (await getHits()).history;
    for (const name of TAB_NAMES.slice(1)) await page.getByRole("tab", { name, exact: true }).click();
    expect((await getHits()).history).toBe(before);
  });

  // Un test par adresse : la redirection arrive après le squelette, elle est lente en mode développement.
  for (const requested of ["n-importe-quoi", "match", "Carriere"]) {
    test(`?mode=${requested} est redirigé vers l'URL canonique`, async ({ page, context }) => {
      await loginAs(context, "admin");
      await page.goto(`/hall-of-fame?mode=${requested}`);
      await expect(page).toHaveURL(/\/hall-of-fame$/, { timeout: 25_000 });
      await expect(page.getByRole("tab", { name: "Match", exact: true })).toHaveAttribute("aria-selected", "true");
    });
  }

  test("le lien du menu depuis un autre mode revient à « Match »", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame?mode=carriere");
    await expect(page.getByRole("tab", { name: "Carrière", exact: true })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Palmarès" }).click();
    await expect(page).toHaveURL(/\/hall-of-fame$/);
    await expect(page.getByRole("tab", { name: "Match", exact: true })).toHaveAttribute("aria-selected", "true");
  });

  test("se change au toucher", async ({ browser }) => {
    const touchContext = await browser.newContext({ hasTouch: true, baseURL: "http://localhost:3100", reducedMotion: "reduce" });
    await loginAs(touchContext, "admin");
    const page = await touchContext.newPage();
    await page.goto("/hall-of-fame");
    await page.getByRole("tab", { name: "Saison", exact: true }).tap();
    await expect(page).toHaveURL(/\?mode=saison$/);
    await touchContext.close();
  });
});

test.describe("Cartes", () => {
  test("9 cartes dans l'ordre fixe, pour chacun des 5 modes", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    for (const name of TAB_NAMES) {
      await page.getByRole("tab", { name, exact: true }).click();
      await expect(panel(page).getByRole("heading", { level: 2 })).toHaveText(CARD_TITLES);
    }
  });

  test("une carte affiche 10 joueurs avec rang, nom et valeur formatée", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    const points = card(page, "Points");
    await expect(rows(points)).toHaveCount(10);
    await expect(rows(points).first().getByRole("rowheader")).toHaveText("Rang 1");
    await expect(rows(points).first()).toContainText("Lucas MARCHAND");
    expect((await values(points)).slice(0, 3)).toEqual(["38", "35", "32"]);
    await page.getByRole("tab", { name: "Moyenne par match", exact: true }).click();
    expect((await values(card(page, "Points"))).slice(0, 2)).toEqual(["17,4", "16,3"]);
  });

  test("chaque ligne mène à la fiche du joueur, y compris en cliquant sur la valeur", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    // Clic au centre de la cellule de valeur : le lien étiré couvre toute la ligne.
    const value = rows(card(page, "Points")).first().locator("td").last();
    const box = (await value.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/\/player\/LIC1000/);
  });

  test("sous-titre propre à chaque mode, « et non par match » pour la moyenne par saison", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(card(page, "Points")).toContainText("Record sur un seul match");
    await page.getByRole("tab", { name: "Moyenne par saison", exact: true }).click();
    await expect(card(page, "Points")).toContainText("et non par match");
  });

  test("les 10 lignes restent visibles, sans défilement interne, sur tablette paysage", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/hall-of-fame");
    const points = card(page, "Points");
    await rows(points).last().scrollIntoViewIfNeeded();
    await expect(rows(points).last()).toBeVisible();
    const clipped = await points.evaluate((element) => {
      for (let node: Element | null = element; node && node !== document.body; node = node.parentElement) {
        const { overflowY } = getComputedStyle(node);
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return true;
      }
      return false;
    });
    expect(clipped).toBe(false);
  });

  test("aucun défilement horizontal à 390 px", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/hall-of-fame");
    await expect(card(page, "Points")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("accepte les valeurs envoyées en chaînes numériques", async ({ page, context }) => {
    await setHallOfFameScenario("valeurs-chaine");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame?mode=moyenne-match");
    expect((await values(card(page, "Points"))).slice(0, 2)).toEqual(["17,4", "16,3"]);
  });
});

test.describe("Cas limites", () => {
  test("ex æquo : même rang, mention « ex æquo », rang suivant sauté", async ({ page, context }) => {
    await setHallOfFameScenario("ex-aequo");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    const ranks = await rows(card(page, "Points")).getByRole("rowheader").allTextContents();
    expect(ranks.map((r) => r.replace("Rang", "").trim())).toEqual(["1", "1", "3", "4", "4", "4", "7", "8", "9", "10"]);
    await expect(rows(card(page, "Points")).nth(0)).toContainText("ex æquo");
    await expect(rows(card(page, "Points")).nth(2)).not.toContainText("ex æquo");
    await expect(rows(card(page, "Passes décisives")).locator("text=ex æquo")).toHaveCount(10);
  });

  test("deux valeurs égales à l'affichage partagent le rang (72,6 %)", async ({ page, context }) => {
    await setHallOfFameScenario("ex-aequo");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame?mode=carriere");
    const tirs = card(page, "% Tirs");
    expect((await values(tirs)).slice(0, 3).map((v) => v.replace(/\s/g, " "))).toEqual(["72,6 %", "72,6 %", "70,0 %"]);
    const ranks = await rows(tirs).getByRole("rowheader").allTextContents();
    expect(ranks.slice(0, 3).map((r) => r.replace("Rang", "").trim())).toEqual(["1", "1", "3"]);
  });

  test("photo absente : initiales visibles, aucune image cassée", async ({ page, context }) => {
    await setHallOfFameScenario("photo-null");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(rows(card(page, "Points")).first()).toContainText("LM");
    await page.waitForLoadState("networkidle");
    const broken = await page.evaluate(() =>
      [...document.images].filter((img) => img.offsetParent !== null && (!img.complete || img.naturalWidth === 0)).length,
    );
    expect(broken).toBe(0);
  });

  test("base vide : message unique, pas d'onglets", async ({ page, context }) => {
    await setHallOfFameScenario("vide");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(page.getByRole("heading", { level: 1, name: "Palmarès" })).toBeVisible();
    await expect(page.getByText("Aucun record pour l'instant")).toBeVisible();
    await expect(page.getByRole("tablist")).toHaveCount(0);
  });

  test("moins de 10 joueurs : les lignes qui existent, « Aucune donnée » pour une liste vide", async ({ page, context }) => {
    await setHallOfFameScenario("moins-de-10");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(card(page, "Points")).toContainText("Aucune donnée");
    await expect(card(page, "Points").getByRole("table")).toHaveCount(0);
    await page.getByRole("tab", { name: "Moyenne par match", exact: true }).click();
    await expect(rows(card(page, "Points"))).toHaveCount(1);
    await page.getByRole("tab", { name: "Saison", exact: true }).click();
    await expect(rows(card(page, "Points"))).toHaveCount(3);
  });

  test("une valeur absente n'est jamais classée à 0", async ({ page, context }) => {
    await setHallOfFameScenario("valeur-null");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    expect(await values(card(page, "Points"))).toEqual(["38", "30", "29"]);
  });

  test("toutes les valeurs de pourcentage ont une décimale, jamais NaN", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    for (const name of TAB_NAMES) {
      await page.getByRole("tab", { name, exact: true }).click();
      for (const title of ["% Tirs", "% 3 pts", "% lancers francs"]) {
        for (const value of await values(card(page, title))) expect(value).toMatch(/^\d{1,3},\d\s%$/);
      }
    }
  });

  test("ballons perdus : titre explicite, mention « moins = mieux », rang 1 sans pastille or", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    const turnovers = card(page, "Le plus de ballons perdus");
    await expect(turnovers).toContainText("Moins de ballons perdus = mieux");
    const goldChip = await rows(turnovers).first().getByRole("rowheader").locator("span").first().evaluate((el) => el.className);
    expect(goldChip).not.toContain("bg-rpb-ink");
    const pointsChip = await rows(card(page, "Points")).first().getByRole("rowheader").locator("span").first().evaluate((el) => el.className);
    expect(pointsChip).toContain("bg-rpb-ink");
  });
});

test.describe("Corrections du back en attente", () => {
  test("une mention d'attente apparaît sur les cartes concernées, et seulement elles", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(card(page, "% Tirs")).toContainText("ne compte pour l'instant que les tirs à 2 points");
    await expect(card(page, "% 3 pts")).not.toContainText("Calcul en cours de correction");
    await expect(card(page, "Points")).not.toContainText("Calcul en cours de correction");
    await page.getByRole("tab", { name: "Moyenne par match", exact: true }).click();
    for (const title of ["% Tirs", "% 3 pts", "% lancers francs"]) {
      await expect(card(page, title)).toContainText("identique à « Carrière »");
    }
    await page.getByRole("tab", { name: "Moyenne par saison", exact: true }).click();
    await expect(card(page, "% lancers francs")).toContainText("une saison sans tentative compte pour l'instant comme 0 %");
    await expect(card(page, "Points")).not.toContainText("Calcul en cours de correction");
  });
});

test.describe("Appels au back et erreurs", () => {
  test("un seul appel à /api/history par chargement, jamais depuis le navigateur", async ({ page, context }) => {
    const browserCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().startsWith(MOCK_API_URL) && !request.url().includes("/public/images/")) browserCalls.push(request.url());
    });
    await loginAs(context, "admin");
    await setHallOfFameScenario("nominal");
    await page.goto("/hall-of-fame");
    await expect(card(page, "Points")).toBeVisible();
    expect((await getHits()).history).toBe(1);
    expect(browserCalls).toEqual([]);
  });

  test("panne du back : message et « Réessayer », qui recharge au retour du back", async ({ page, context }) => {
    await setHallOfFameScenario("error");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    const alert = page.getByRole("alert").filter({ hasText: "Impossible de charger le palmarès" });
    await expect(alert).toContainText("Impossible de charger le palmarès");
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await setHallOfFameScenario("nominal");
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(card(page, "Points")).toBeVisible();
  });

  test("forme générale invalide : traitée comme une panne globale", async ({ page, context }) => {
    await setHallOfFameScenario("forme-invalide");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(page.getByRole("alert").filter({ hasText: "Impossible de charger le palmarès" })).toBeVisible();
  });

  test("une tranche invalide n'abîme que sa carte, dans chacun des modes", async ({ page, context }) => {
    await setHallOfFameScenario("tranche-invalide");
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    for (const name of TAB_NAMES) {
      await page.getByRole("tab", { name, exact: true }).click();
      await expect(panel(page).getByRole("alert")).toHaveCount(1);
      await expect(panel(page).getByRole("alert")).toContainText("Rebonds");
      await expect(card(page, "Points")).toBeVisible();
      await expect(card(page, "% lancers francs")).toBeVisible();
    }
  });
});

test.describe("Accessibilité", () => {
  test("rôles ARIA, tableaux nommés et en-têtes de colonnes", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    await expect(page.getByRole("tablist")).toBeVisible();
    await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", /.+/);
    const table = page.getByRole("table", { name: "Points : Meilleur match, top 10" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader")).toHaveText(["Rang", "Joueur", "Valeur"]);
    await expect(table.getByRole("row")).toHaveCount(11);
  });

  test("les onglets et les lignes mesurent au moins 48 px de haut", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/hall-of-fame");
    for (const name of TAB_NAMES) {
      expect((await page.getByRole("tab", { name, exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    expect((await rows(card(page, "Points")).first().boundingBox())!.height).toBeGreaterThanOrEqual(48);
  });
});
