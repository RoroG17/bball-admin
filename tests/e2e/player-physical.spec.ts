import { expect, test, type Page } from "@playwright/test";
import { loginAs, setPlayerScenario } from "./helpers";

/*
 * LIC1000 : 9 mesures. Taille 170 → 172 → 172, Détente 46 → 49 → 49, VMA 12,5 → 15 → 15 (15 janvier, 26 mai, 17 juillet 2026).
 */
const PHYSICAL = "/player/LIC1000?saison=4&onglet=physique";
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

const card = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Ajouter une mesure" });
const openDialog = async (page: Page) => {
  await page.getByRole("button", { name: "Ajouter une mesure" }).click();
  await expect(dialog(page)).toBeVisible();
};
const fill = async (page: Page, fields: { date?: string; type?: string; value?: string }) => {
  if (fields.date !== undefined) await dialog(page).getByLabel("Date de la mesure").fill(fields.date);
  if (fields.type !== undefined) await dialog(page).getByLabel("Mesure", { exact: true }).selectOption(fields.type);
  if (fields.value !== undefined) await dialog(page).getByLabel("Valeur").fill(fields.value);
};
const submit = (page: Page) => dialog(page).getByRole("button", { name: "Enregistrer" }).click();

test.beforeEach(async () => {
  await setPlayerScenario();
});

test.describe("Onglet Physique", () => {
  test("une carte par type : dernière valeur, date, écart et historique", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(PHYSICAL);
    await expect(page.getByText("9 mesures", { exact: true })).toBeVisible();
    for (const type of ["Taille", "Détente", "VMA"]) {
      await expect(card(page, type).getByText("Mesuré le 17 juillet 2026")).toBeVisible();
      await expect(card(page, type).getByText("stable", { exact: true })).toBeVisible();
      await expect(card(page, type).getByText("depuis le 26 mai 2026", { exact: true })).toBeVisible();
      await expect(card(page, type).getByRole("img")).toHaveAccessibleName(/le 17 juillet 2026, stable depuis le 26 mai 2026$/);
    }
    const history = card(page, "Taille");
    await history.getByText("Historique (3 mesures)").click();
    await expect(history.getByRole("table").getByRole("rowheader")).toHaveText(["17 juillet 2026", "26 mai 2026", "15 janvier 2026"]);
  });

  test("le joueur n'a pas de bouton d'ajout ; l'admin si", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(PHYSICAL);
    await expect(page.getByRole("button", { name: "Ajouter une mesure" })).toHaveCount(0);
    await loginAs(context, "admin");
    await page.goto(PHYSICAL);
    await expect(page.getByRole("button", { name: "Ajouter une mesure" })).toBeVisible();
  });

  test("un coéquipier ne voit pas la physique (P1)", async ({ page, context }) => {
    await loginAs(context, "player");
    const response = await page.goto("/player/LIC2000?saison=4&onglet=physique");
    await expect(page).toHaveURL(/\/player\/LIC2000\?saison=4$/);
    expect(await response!.text()).not.toMatch(/Données physiques|Mesuré le|Historique \(/);
  });

  test("type de mesure inconnu : écarté et signalé aux admins seulement (P6)", async ({ page, context }) => {
    await setPlayerScenario({ physics: "type-inconnu" });
    await loginAs(context, "admin");
    await page.goto(PHYSICAL);
    await expect(page.getByText("9 mesures", { exact: true })).toBeVisible();
    await expect(page.getByText("1 mesure d'un type non reconnu (« Détente verticale ») n'est pas affichée.")).toBeVisible();
    await loginAs(context, "player");
    await page.goto(PHYSICAL);
    await expect(page.getByText(/type non reconnu/)).toHaveCount(0);
  });

  test("même rendu avec la forme MySQL du back", async ({ page, context }) => {
    await setPlayerScenario({ physics: "mysql" });
    await loginAs(context, "player");
    await page.goto(PHYSICAL);
    await expect(page.getByText("9 mesures", { exact: true })).toBeVisible();
    await expect(card(page, "Détente").getByText("Mesuré le 17 juillet 2026")).toBeVisible();
  });

  test("aucune mesure : états vides dans la synthèse et dans l'onglet", async ({ page, context }) => {
    await setPlayerScenario({ physics: "vide" });
    await loginAs(context, "player");
    await page.goto(PHYSICAL);
    await expect(page.getByText("Aucune donnée physique enregistrée pour ce joueur.")).toBeVisible();
    await expect(page.getByText("Aucune donnée physique enregistrée.", { exact: true })).toBeVisible();
    await expect(page.getByText("0 mesure", { exact: true })).toBeVisible();
  });

  test("lecture impossible : la synthèse et l'onglet sont en erreur, pas le reste", async ({ page, context }) => {
    await setPlayerScenario({ physics: "error" });
    await loginAs(context, "player");
    await page.goto(PHYSICAL);
    await expect(page.getByRole("heading", { level: 1, name: "Lucas MARCHAND" })).toBeVisible();
    await expect(page.locator("section[role=alert]")).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Données physiques" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Physique", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Dernier match", exact: true })).toBeVisible();
  });
});

test.describe("Ajout d'une mesure (admin)", () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, "admin");
  });

  test("la boîte est un dialogue nommé ; Annuler et Échap la ferment", async ({ page }) => {
    await page.goto(PHYSICAL);
    await openDialog(page);
    await expect(dialog(page).getByText("Choisis d'abord une mesure.")).toBeVisible();
    await dialog(page).getByRole("button", { name: "Annuler" }).click();
    await expect(dialog(page)).toHaveCount(0);
    await openDialog(page);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ajouter une mesure" })).toBeFocused();
  });

  test("l'aide et l'unité suivent le type choisi", async ({ page }) => {
    await page.goto(PHYSICAL);
    await openDialog(page);
    await fill(page, { type: "height" });
    await expect(dialog(page).getByText("Entre 100 et 230 cm.")).toBeVisible();
    await fill(page, { type: "vma" });
    await expect(dialog(page).getByText("Entre 5 et 25 km/h.")).toBeVisible();
  });

  test("champs vides : une erreur par champ, focus sur le premier champ invalide", async ({ page }) => {
    await page.goto(PHYSICAL);
    await openDialog(page);
    await submit(page);
    await expect(dialog(page).getByText("Saisis une date valide.")).toBeVisible();
    await expect(dialog(page).getByText("Choisis une mesure.")).toBeVisible();
    await expect(dialog(page).getByText("Saisis une valeur numérique.")).toBeVisible();
    await expect(dialog(page).getByLabel("Date de la mesure")).toBeFocused();
    await expect(dialog(page).getByLabel("Date de la mesure")).toHaveAttribute("aria-invalid", "true");
  });

  test("date future et valeur hors plage, saisie conservée", async ({ page }) => {
    await page.goto(PHYSICAL);
    await openDialog(page);
    await fill(page, { date: "2099-01-01", type: "verticalJump", value: "200" });
    await submit(page);
    await expect(dialog(page).getByText("La date ne peut pas être dans le futur.")).toBeVisible();
    await expect(dialog(page).getByText("La détente doit être comprise entre 5 et 120 cm.")).toBeVisible();
    await expect(dialog(page).getByLabel("Date de la mesure")).toHaveValue("2099-01-01");
    await expect(dialog(page).getByLabel("Valeur")).toHaveValue("200");
    await expect(dialog(page).getByLabel("Mesure", { exact: true })).toHaveValue("verticalJump");
  });

  test("doublon même type / même date refusé avec la valeur existante", async ({ page }) => {
    await page.goto(PHYSICAL);
    await openDialog(page);
    await fill(page, { date: "2026-01-15", type: "verticalJump", value: "50" });
    await submit(page);
    await expect(dialog(page).getByText("Une mesure de détente existe déjà à cette date (46 cm).")).toBeVisible();
  });

  test("enregistrement : boîte fermée, confirmation, nouvelle valeur dans l'onglet ET la synthèse", async ({ page }) => {
    await page.goto(PHYSICAL);
    await openDialog(page);
    await fill(page, { date: TODAY, type: "verticalJump", value: "70,5" });
    await submit(page);
    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByText("Mesure enregistrée")).toBeVisible();
    await expect(page.getByText("10 mesures", { exact: true })).toBeVisible();
    await expect(card(page, "Détente").getByText("Mesuré le", { exact: false })).toContainText(/\d{4}$/);
    await expect(card(page, "Détente").getByText("Historique (4 mesures)")).toBeVisible();
    const summary = page.getByRole("region", { name: "Données physiques" });
    await expect(summary.getByText(/^Détente : 70,5 cm le /)).toBeAttached();
    await expect(summary.getByText(/\+21,5 cm depuis le 17 juillet 2026/)).toBeAttached();
  });

  test("refus du back (422) : message sous le champ, boîte ouverte", async ({ page }) => {
    await setPlayerScenario({ physicsPost: "422" });
    await page.goto(PHYSICAL);
    await openDialog(page);
    await fill(page, { date: "2026-02-10", type: "verticalJump", value: "62" });
    await submit(page);
    await expect(dialog(page).getByText("The value field must be a number.")).toBeVisible();
    await expect(dialog(page).getByLabel("Valeur")).toHaveValue("62");
  });

  test("erreur serveur : message global, rien n'est perdu", async ({ page }) => {
    await setPlayerScenario({ physicsPost: "error" });
    await page.goto(PHYSICAL);
    await openDialog(page);
    await fill(page, { date: "2026-02-10", type: "verticalJump", value: "62" });
    await submit(page);
    await expect(dialog(page).getByRole("alert")).toContainText("Échec de l'enregistrement. Vérifie ta connexion puis réessaie.");
    await expect(dialog(page).getByLabel("Date de la mesure")).toHaveValue("2026-02-10");
    await expect(dialog(page).getByLabel("Valeur")).toHaveValue("62");
  });

  test("à 390 px, la boîte tient dans l'écran", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(PHYSICAL);
    await openDialog(page);
    const box = await dialog(page).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.height).toBeLessThanOrEqual(700);
  });
});
