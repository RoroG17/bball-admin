import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { APP_URL, getWrites, loginAs, setAdminScenario } from "./helpers";

/*
 * Équipes (spec § 8, corrigée par D-ADM-1 et D-T10). Fixtures reconstruites : `tests/fixtures/admin-team/`.
 * FAC Basket (1) = équipe du club ; « Étoile Cugnaux » (15) sans joueur ni match ; « Basket Inconnu » (16) a un logo introuvable.
 */
const teams = JSON.parse(
  readFileSync(path.resolve(__dirname, "../fixtures/admin-team/equipes.json"), "utf8"),
) as { Id_Equipe: number; nom: string; logo: string | null }[];
const matchs = JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/calendar/matchs.e2e.json"), "utf8")) as unknown[];

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
const SORTED_NAMES = teams.map((team) => team.nom).sort(collator.compare);

const nameField = (page: Page) => page.getByRole("textbox", { name: "Nom de l'équipe" });
const logoField = (page: Page) => page.getByRole("textbox", { name: "Logo (nom de fichier)" });
const rows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });

test.beforeEach(async ({ context }) => {
  await setAdminScenario();
  await loginAs(context, "admin");
});

test.describe("Liste", () => {
  test("triée par nom, logo ou initiales, aucune image cassée", async ({ page }) => {
    await page.goto("/admin/team");
    await expect(page.getByRole("heading", { level: 1, name: "Équipes" })).toBeVisible();
    await expect(rows(page)).toHaveCount(teams.length);
    for (const [index, name] of SORTED_NAMES.entries()) {
      await expect(rows(page).nth(index).getByRole("cell").first()).toContainText(name);
    }
    await expect
      .poll(() =>
        page.getByRole("table").locator("img").evaluateAll((images) =>
          images.filter((image) => !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0).length,
        ),
      )
      .toBe(0);
  });

  test("recherche sans casse ni accents, URL canonique", async ({ page }) => {
    await page.goto("/admin/team");
    await page.getByRole("searchbox", { name: "Rechercher une équipe" }).fill("ETOILE");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team?q=ETOILE`);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Étoile Cugnaux");
    await page.goto("/admin/team?q=%20etoile%20&tri=name&ordre=asc&page=1");
    await expect(page).toHaveURL(`${APP_URL}/admin/team?q=etoile`);
  });

  test("filtre Équipes du club / Autres équipes, valeur inconnue retirée", async ({ page }) => {
    await page.goto("/admin/team?type=club");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Équipe du club");
    await page.goto("/admin/team?type=other");
    await expect(rows(page)).toHaveCount(teams.length - 1);
    await page.goto("/admin/team?type=zzz");
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
  });

  test("tri : un clic inverse, l'état est dans l'URL et annoncé", async ({ page }) => {
    await page.goto("/admin/team");
    await page.getByRole("columnheader", { name: /Joueurs/ }).getByRole("link").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team?tri=players`);
    await expect(page.getByRole("columnheader", { name: /Joueurs/ })).toHaveAttribute("aria-sort", "ascending");
    await expect(rows(page).first()).toContainText("Aucun joueur");
  });

  test("indicateur « Équipe du club » en texte, actions nommées, cibles de 44 px", async ({ page }) => {
    await page.goto("/admin/team");
    const fac = page.getByRole("row", { name: /FAC Basket/ });
    await expect(fac.getByText("Équipe du club")).toBeVisible();
    await expect(fac).toContainText("2 saisons");
    await expect(page.getByRole("row", { name: /US Colomiers/ }).getByText("Autre équipe")).toBeVisible();
    for (const name of ["Modifier US Colomiers", "Supprimer US Colomiers"]) {
      const box = await page.getByRole("link", { name }).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("chargement : squelette visible", async ({ page }) => {
    await setAdminScenario({ equipes: "lent" });
    await page.goto("/admin/team", { waitUntil: "commit" });
    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("aucune équipe : état vide avec action de création (tutoiement)", async ({ page }) => {
    await setAdminScenario({ equipes: "vide" });
    await page.goto("/admin/team");
    await expect(page.getByText("Aucune équipe. Crée la première.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Nouvelle équipe" })).toHaveCount(2);
  });

  test("recherche sans résultat : réinitialisation proposée", async ({ page }) => {
    await page.goto("/admin/team?q=zzzz");
    await expect(page.getByText("Aucune équipe ne correspond.")).toBeVisible();
    await page.getByRole("link", { name: "Réinitialiser les filtres" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
  });

  test("lecture en échec : erreur de bloc avec « Réessayer », jamais une liste vide", async ({ page }) => {
    await setAdminScenario({ equipes: "error" });
    await page.goto("/admin/team");
    await expect(page.getByText("Impossible de charger ce bloc")).toBeVisible();
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("saisons illisibles : liste affichée, indicateur « — » et avertissement", async ({ page }) => {
    // Le faux back sert `/api/saisons` et `/api/joueurs` ; ici les joueurs sont en erreur.
    await setAdminScenario({ joueurs: "error" });
    await page.goto("/admin/team");
    await expect(page.getByText("Les indicateurs d'usage sont momentanément indisponibles.")).toBeVisible();
    await expect(rows(page)).toHaveCount(teams.length);
  });
});

test.describe("Création", () => {
  test("nom de 256 caractères : erreur, aucune écriture", async ({ page }) => {
    await page.goto("/admin/team/create");
    await nameField(page).evaluate((input: HTMLInputElement) => input.removeAttribute("maxlength"));
    await nameField(page).fill("a".repeat(256));
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    await expect(nameField(page)).toHaveAccessibleDescription("Le nom ne peut pas dépasser 255 caractères.");
    expect(await getWrites()).toEqual([]);
  });

  for (const logo of ["a/b.png", "../x.png", "https://x.fr/y.png"]) {
    test(`logo « ${logo} » refusé sous le champ, aucune écriture`, async ({ page }) => {
      await page.goto("/admin/team/create");
      await nameField(page).fill("Nouvelle équipe");
      await logoField(page).fill(logo);
      await page.getByRole("button", { name: "Créer l'équipe" }).click();
      await expect(logoField(page)).toHaveAccessibleDescription(/nom de fichier simple/);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("doublon (casse et accents) : refus avec le nom de l'équipe existante", async ({ page }) => {
    await page.goto("/admin/team/create");
    await nameField(page).fill("us colomiers");
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    await expect(nameField(page)).toHaveAccessibleDescription("Une équipe porte déjà ce nom (« US Colomiers »).");
    expect(await getWrites()).toEqual([]);
  });

  test("succès : message, ligne mise en évidence, URL nettoyée", async ({ page }) => {
    await page.goto("/admin/team/create");
    await nameField(page).fill("Pibrac Basket Club");
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Équipe « Pibrac Basket Club » créée." })).toBeVisible();
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
    await expect(page.getByRole("row", { name: /Pibrac Basket Club/ })).toContainText("Vient d'être enregistrée");
    await page.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("status")).toBeEmpty();
  });

  test("500 : message serveur, saisie conservée", async ({ page }) => {
    await setAdminScenario({ adminWrite: "error" });
    await page.goto("/admin/team/create");
    await nameField(page).fill("Équipe en panne");
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Le serveur a refusé l'opération." })).toBeVisible();
    await expect(nameField(page)).toHaveValue("Équipe en panne");
  });

  test("aperçu du logo : fichier introuvable → avertissement non bloquant, envoi possible", async ({ page }) => {
    await page.goto("/admin/team/create");
    await expect(page.getByText("Aucun logo")).toBeVisible();
    await nameField(page).fill("Équipe sans fichier");
    await logoField(page).fill("inconnu.png");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("status").filter({ hasText: "Aucun fichier de ce nom sur le serveur" })).toBeVisible();
    await page.getByRole("button", { name: "Créer l'équipe" }).click();
    await expect(page.getByRole("status").filter({ hasText: "créée." })).toBeVisible();
    expect(await getWrites()).toMatchObject([{ body: { nom: "Équipe sans fichier", logo: "inconnu.png" } }]);
  });

  test("aperçu du logo : fichier présent → image", async ({ page }) => {
    await page.goto("/admin/team/create");
    await logoField(page).fill("logo_cazeres.png");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("img", { name: "Aperçu du logo" })).toBeVisible();
  });

  test("« Annuler » : retour à la liste sans écriture ni confirmation", async ({ page }) => {
    await page.goto("/admin/team/create");
    await nameField(page).fill("Brouillon");
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team`);
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Modification", () => {
  test("identifiants inconnus ou invalides : « Équipe introuvable », jamais de formulaire", async ({ page }) => {
    for (const id of ["999", "abc"]) {
      await page.goto(`/admin/team/${id}/edit`);
      await expect(page.getByRole("heading", { level: 1, name: "Équipe introuvable" })).toBeVisible();
      await expect(nameField(page)).toHaveCount(0);
    }
  });

  test("lecture en échec : page d'erreur, pas de formulaire", async ({ page }) => {
    await setAdminScenario({ equipes: "error" });
    await page.goto("/admin/team/10/edit");
    await expect(page.getByRole("heading", { name: "Impossible de charger cette page" })).toBeVisible();
    await expect(nameField(page)).toHaveCount(0);
  });

  test("formulaire pré-rempli et usage de l'équipe du club", async ({ page }) => {
    await page.goto("/admin/team/1/edit");
    await expect(nameField(page)).toHaveValue("FAC Basket");
    await expect(logoField(page)).toHaveValue("logo_frouzins.png");
    const usage = page.getByRole("region", { name: "Utilisation de cette équipe" });
    await expect(usage).toContainText("Équipe du club pour :");
    await expect(usage).toContainText("18");
    await expect(usage).toContainText(String(matchs.length));
  });

  test("renommage : message, pastille et ligne mise à jour", async ({ page }) => {
    await page.goto("/admin/team/16/edit");
    await nameField(page).fill("Basket Inconnu 2");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Équipe « Basket Inconnu 2 » modifiée." })).toBeVisible();
    await expect(page.getByRole("row", { name: /Basket Inconnu 2/ })).toContainText("Vient d'être enregistrée");
    expect(await getWrites()).toMatchObject([{ method: "PUT", path: "/api/equipes/16", body: { nom: "Basket Inconnu 2", logo: "inconnu.png" } }]);
  });

  test("retrait de logo refusé avec message, aucune écriture", async ({ page }) => {
    await page.goto("/admin/team/1/edit");
    await logoField(page).fill("");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(logoField(page)).toHaveAccessibleDescription(/ne permet pas encore de retirer un logo/);
    expect(await getWrites()).toEqual([]);
  });

  test("renommage vers un doublon refusé", async ({ page }) => {
    await page.goto("/admin/team/16/edit");
    await nameField(page).fill("OTB");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(nameField(page)).toHaveAccessibleDescription("Une équipe porte déjà ce nom (« OTB »).");
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Suppression", () => {
  test("équipe du club : bouton présent, impact chiffré, données indéterminées signalées", async ({ page }) => {
    await page.goto("/admin/team/1/delete");
    await expect(page.getByRole("heading", { level: 2, name: "Supprimer « FAC Basket » ?" })).toBeVisible();
    await expect(page.getByText("Cette équipe est l'équipe du club sur au moins une saison.")).toBeVisible();
    const impact = page.getByRole("region", { name: "Seront aussi supprimés :" });
    await expect(impact).toContainText("18 joueurs");
    await expect(impact).toContainText("3 comptes utilisateurs");
    await expect(impact).toContainText("2 saisons");
    await expect(impact).toContainText(`${matchs.length} matchs`);
    await expect(impact).toContainText("un nombre indéterminé de");
    await expect(impact).toContainText("D'autres données liées peuvent aussi être supprimées.");
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toBeVisible();
  });

  test("adversaire isolé : aucune autre donnée liée", async ({ page }) => {
    await page.goto("/admin/team/15/delete");
    await expect(page.getByText("Aucune autre donnée n'est liée à cet élément.")).toBeVisible();
  });

  test("suppression d'une équipe utilisée : aboutit (aucun blocage applicatif)", async ({ page }) => {
    await page.goto("/admin/team/1/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Équipe supprimée." })).toBeVisible();
    await expect(page.getByRole("row", { name: /FAC Basket/ })).toHaveCount(0);
  });

  test("identifiant inconnu : « Équipe introuvable »", async ({ page }) => {
    await page.goto("/admin/team/999/delete");
    await expect(page.getByRole("heading", { level: 1, name: "Équipe introuvable" })).toBeVisible();
  });

  test("depuis la modification, l'action « Supprimer » mène à la confirmation", async ({ page }) => {
    await page.goto("/admin/team/15/edit");
    await page.getByRole("link", { name: "Supprimer Étoile Cugnaux" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/team/15/delete`);
  });
});

test.describe("Accessibilité", () => {
  test("parcours clavier de la liste à la modification", async ({ page }) => {
    await page.goto("/admin/team");
    await page.getByRole("link", { name: "Modifier OTB" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${APP_URL}/admin/team/14/edit`);
    await expect(nameField(page)).toHaveValue("OTB");
    await nameField(page).focus();
    await page.keyboard.press("End");
    await page.keyboard.type(" 2");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Enregistrer" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Équipe « OTB 2 » modifiée." })).toBeVisible();
  });

  test("champs de 48 px, interface en français", async ({ page }) => {
    await page.goto("/admin/team/create");
    const box = await nameField(page).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });
});
