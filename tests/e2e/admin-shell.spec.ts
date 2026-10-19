import { expect, test, type Page } from "@playwright/test";
import { APP_URL, getHits, getWrites, loginAs, setAdminScenario } from "./helpers";

/*
 * Socle de l'administration (architecture admin-shared § 7.5), éprouvé avec la première feature livrée : les équipes.
 * Fixtures reconstruites (`tests/fixtures/admin-team/`) : 16 équipes, FAC Basket (id 1) = équipe du club,
 * « Étoile Cugnaux » (id 15) sans joueur ni match.
 */
const SECTIONS = ["Joueurs", "Équipes", "Saisons", "Matchs", "Utilisateurs", "Journaux"];

const adminNav = (page: Page) => page.getByRole("navigation", { name: "Administration" });
const mainNav = (page: Page) => page.getByRole("navigation", { name: "Navigation principale" });
const deniedHeading = (page: Page) => page.getByRole("heading", { level: 1, name: "Accès refusé" });

test.beforeEach(async () => {
  await setAdminScenario();
});

test.describe("Accès", () => {
  test("visiteur anonyme : connexion avec la page demandée, puis retour", async ({ page }) => {
    await page.goto("/admin/team");
    await expect(page).toHaveURL(`${APP_URL}/login?redirect=%2Fadmin%2Fteam`);
    await page.getByLabel("Identifiant").fill("admin");
    await page.getByLabel("Mot de passe", { exact: true }).fill("admin-e2e");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
    await expect(page.getByRole("heading", { level: 1, name: "Équipes" })).toBeVisible();
  });

  for (const path of [
    "/admin",
    "/admin/team",
    "/admin/team/create",
    "/admin/team/1/edit",
    "/admin/team/1/delete",
  ]) {
    test(`joueur sur ${path} : « Accès refusé », sans navigation admin ni appel de données`, async ({ page, context }) => {
      await loginAs(context, "player");
      await page.goto(path);
      await expect(deniedHeading(page)).toBeVisible();
      await expect(adminNav(page)).toHaveCount(0);
      const hits = await getHits();
      expect(hits.adminReads).toBe(0);
      expect(hits.equipes).toBe(0);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("l'entrée « Administration » de l'en-tête est réservée à l'admin", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/game?saison=4");
    await expect(mainNav(page).getByRole("link", { name: "Joueurs" })).toBeVisible();
    await expect(mainNav(page).getByRole("link", { name: "Administration" })).toHaveCount(0);

    await context.clearCookies();
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(mainNav(page).getByRole("link", { name: "Administration" })).toHaveAttribute("href", "/admin");
  });

  test("une action appelée avec une session joueur ne produit aucune écriture", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin/team/create");
    await page.getByRole("textbox", { name: "Nom de l'équipe" }).fill("Équipe pirate");
    const reads = (await getHits()).adminReads;

    // La page reste ouverte, mais la session devient celle d'un joueur : l'action doit relire le rôle.
    await context.clearCookies();
    await loginAs(context, "player");
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Action réservée aux administrateurs." })).toBeVisible();
    expect(await getWrites()).toEqual([]);
    expect((await getHits()).adminReads).toBe(reads);
  });
});

test.describe("Coquille", () => {
  test("accueil : six rubriques dans l'ordre, chacune mène à sa page", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Administration" })).toBeVisible();
    await expect(adminNav(page).getByRole("link")).toHaveText(SECTIONS);
    const cards = page.getByRole("main").getByRole("link");
    await expect(cards).toHaveText(SECTIONS);
    await cards.nth(1).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
    await expect(page.getByRole("heading", { level: 1, name: "Équipes" })).toBeVisible();
  });

  test("aria-current sur la rubrique courante, y compris sur une sous-page", async ({ page, context }) => {
    await loginAs(context, "admin");
    for (const path of ["/admin/team", "/admin/team/create", "/admin/team/1/edit", "/admin/team/1/delete"]) {
      await page.goto(path);
      const current = adminNav(page).locator('a[aria-current="page"]');
      await expect(current).toHaveText("Équipes");
      await expect(current).toHaveCount(1);
      await expect(mainNav(page).getByRole("link", { name: "Administration" })).toHaveAttribute("aria-current", "page");
    }
    await page.goto("/admin");
    await expect(adminNav(page).locator('a[aria-current="page"]')).toHaveCount(0);
  });

  test("fil d'Ariane : dernier élément sans lien", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin/team/create");
    const crumbs = page.getByRole("navigation", { name: "Fil d'Ariane" });
    await expect(crumbs.getByRole("link")).toHaveText(["Administration", "Équipes"]);
    await expect(crumbs.getByText("Nouvelle équipe")).toHaveAttribute("aria-current", "page");
  });
});

test.describe("Formulaire", () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, "admin");
  });

  test("champ vide : erreur sous le champ, focus dessus, aucune écriture", async ({ page }) => {
    await page.goto("/admin/team/create");
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    const name = page.getByRole("textbox", { name: "Nom de l'équipe" });
    await expect(name).toHaveAccessibleDescription("Le nom de l'équipe est obligatoire.");
    await expect(name).toBeFocused();
    expect(await getWrites()).toEqual([]);
  });

  test("422 du back : erreur de champ en français, jamais la phrase anglaise, saisie conservée", async ({ page }) => {
    await setAdminScenario({ adminWrite: "422" });
    await page.goto("/admin/team/create");
    await page.getByRole("textbox", { name: "Nom de l'équipe" }).fill("Équipe refusée");
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    const name = page.getByRole("textbox", { name: "Nom de l'équipe" });
    await expect(name).toHaveAccessibleDescription("Ce champ est obligatoire.");
    await expect(name).toHaveValue("Équipe refusée");
    await expect(page.getByText("The nom field")).toHaveCount(0);
  });

  test("double clic : une seule écriture", async ({ page }) => {
    await setAdminScenario({ adminWrite: "slow" });
    await page.goto("/admin/team/create");
    await page.getByRole("textbox", { name: "Nom de l'équipe" }).fill("Pibrac Basket Club");
    await page.getByRole("button", { name: "Créer l'équipe" }).dblclick();
    await expect(page).toHaveURL(/\/admin\/team/);
    await expect(page.getByRole("heading", { level: 1, name: "Équipes" })).toBeVisible();
    expect((await getWrites()).filter((write) => write.method === "POST")).toHaveLength(1);
  });

  test("succès : retour à la liste, message annoncé, URL nettoyée", async ({ page }) => {
    await page.goto("/admin/team/create");
    await page.getByRole("textbox", { name: "Nom de l'équipe" }).fill("Pibrac Basket Club");
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Équipe « Pibrac Basket Club » créée." })).toBeVisible();
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
    const [write] = await getWrites();
    expect(write).toMatchObject({ method: "POST", path: "/api/equipes", body: { nom: "Pibrac Basket Club" } });
    expect(write.authorization).toBe("Bearer e2e");
  });

  test("clavier : liste, création et envoi sans souris", async ({ page }) => {
    await page.goto("/admin/team");
    await page.getByRole("link", { name: "Nouvelle équipe" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${APP_URL}/admin/team/create`);
    await page.getByRole("textbox", { name: "Nom de l'équipe" }).focus();
    await page.keyboard.type("Équipe au clavier");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("textbox", { name: "Logo (nom de fichier)" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Créer l'équipe" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Équipe « Équipe au clavier » créée." })).toBeVisible();
  });
});

test.describe("Suppression", () => {
  test.beforeEach(async ({ context }) => {
    await loginAs(context, "admin");
  });

  const confirm = (page: Page) => page.getByRole("button", { name: "Supprimer définitivement" });

  test("confirmation chiffrée, « Annuler » sans écriture", async ({ page }) => {
    await page.goto("/admin/team/15/delete");
    await expect(page.getByRole("heading", { level: 2, name: "Supprimer « Étoile Cugnaux » ?" })).toBeVisible();
    await expect(page.getByText("Aucune autre donnée n'est liée à cet élément.")).toBeVisible();
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
    expect(await getWrites()).toEqual([]);
  });

  test("500 : message de suppression échouée, la ligne reste", async ({ page }) => {
    await setAdminScenario({ adminWrite: "error" });
    await page.goto("/admin/team/15/delete");
    await confirm(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "La suppression a échoué" })).toBeVisible();
    await page.goto("/admin/team");
    await expect(page.getByRole("row", { name: /Étoile Cugnaux/ })).toBeVisible();
  });

  test("404 : l'équipe n'existe plus, la ligne est retirée", async ({ page }) => {
    await setAdminScenario({ adminWrite: "404" });
    await page.goto("/admin/team/15/delete");
    await confirm(page).click();
    // L'action rafraîchit les pages : la page de suppression, relue, n'a plus d'équipe (« introuvable »).
    await expect(page.getByRole("heading", { level: 1, name: "Équipe introuvable" })).toBeVisible();
    await page.goto("/admin/team");
    await expect(page.getByRole("row", { name: /Étoile Cugnaux/ })).toHaveCount(0);
  });

  test("succès : ligne retirée, message", async ({ page }) => {
    await page.goto("/admin/team/15/delete");
    await confirm(page).click();
    await expect(page.getByRole("status").filter({ hasText: "Équipe supprimée." })).toBeVisible();
    await expect(page.getByRole("row", { name: /Étoile Cugnaux/ })).toHaveCount(0);
    expect(await getWrites()).toMatchObject([{ method: "DELETE", path: "/api/equipes/15" }]);
  });

  test("impact en erreur : pas de bouton de suppression, « Réessayer » présent", async ({ page }) => {
    await setAdminScenario({ joueurs: "error" });
    await page.goto("/admin/team/15/delete");
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
    await expect(confirm(page)).toHaveCount(0);
  });

  test("clavier : « Annuler » précède l'action destructrice", async ({ page }) => {
    await page.goto("/admin/team/15/delete");
    await page.getByRole("link", { name: "Annuler" }).focus();
    await page.keyboard.press("Tab");
    await expect(confirm(page)).toBeFocused();
  });
});
