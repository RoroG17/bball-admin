import { expect, test, type Page } from "@playwright/test";
import { loginAs, setPlayerScenario } from "./helpers";

/*
 * LIC1000 : 4 examens (2 décembre 2025, 10 février 2026, 28 avril 2026, 14 mai 2026), dont un tir de zone inconnue (« Corner »).
 */
const EXAMS_URL = "/player/LIC1000?saison=4&onglet=examens";

const section = (page: Page, name: string) => page.getByRole("region", { name, exact: true });

test.beforeEach(async () => {
  await setPlayerScenario();
});

test.describe("Onglet Examens", () => {
  test("nombre d'examens, courbe, tendances en texte, historique", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(EXAMS_URL);
    await expect(page.getByText("4 examens de tir", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Créer un examen" })).toHaveAttribute("href", "/player/LIC1000/examens/nouveau");
    const trend = section(page, "Progression par zone");
    await expect(trend.getByText(/sur les 4 derniers examens, (en progression|en baisse|stable)/)).toHaveCount(3);
    await expect(trend.getByRole("img")).toBeVisible();
    await expect(trend.getByRole("img")).toHaveAccessibleName(/Raquette : .*Mi-distance : .*3 points : /);
  });

  test("le tableau alternatif donne chaque examen du plus récent au plus ancien", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(EXAMS_URL);
    await page.getByText("Voir le détail par examen").click();
    const table = page.getByRole("table", { name: "Réussite par examen et par zone" });
    await expect(table.getByRole("rowheader")).toHaveText(["14 mai 2026", "28 avril 2026", "10 février 2026", "2 décembre 2025"]);
    await expect(table.getByRole("columnheader")).toHaveText(["Date", "Raquette", "Mi-distance", "3 points"]);
  });

  test("le plus récent est ouvert, les autres se déplient (details natif)", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(EXAMS_URL);
    const history = section(page, "Historique des examens");
    const items = history.locator("details");
    await expect(items).toHaveCount(4);
    await expect(items.first()).toHaveAttribute("open", "");
    await expect(items.first().locator("summary")).toContainText("Examen du 14 mai 2026");
    await expect(items.nth(1)).not.toHaveAttribute("open", "");
    await items.nth(1).locator("summary").click();
    await expect(items.nth(1)).toHaveAttribute("open", "");
    await expect(items.nth(1).getByRole("img")).toHaveAccessibleName(/^Examen du 28 avril 2026 : \d+ tirs? réussis? sur \d+\./);
  });

  test("un tir de zone inconnue est compté au total mais dans aucune zone", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(EXAMS_URL);
    const item = section(page, "Historique des examens").locator("details").nth(2);
    await item.locator("summary").click();
    await expect(item.getByText("1 tir sans zone (comptés dans le total)")).toBeVisible();
  });

  test("le joueur voit ses examens, sans le bouton de création", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(EXAMS_URL);
    await expect(page.getByText("4 examens de tir", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Créer un examen" })).toHaveCount(0);
  });

  test("un coéquipier n'accède pas aux examens (P1)", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/player/LIC2000?saison=4&onglet=examens");
    await expect(page).toHaveURL(/\/player\/LIC2000\?saison=4$/);
    await expect(page.getByText(/examen/i)).toHaveCount(0);
  });

  test("joueur sans examen", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/player/LIC4000?saison=4&onglet=examens");
    await expect(page.getByText("Aucun examen enregistré pour ce joueur.")).toBeVisible();
    await expect(page.getByText("0 examen de tir", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Créer un examen" })).toBeVisible();
  });
});
