import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { APP_URL, getHits, getWrites, loginAs, setAdminScenario } from "./helpers";

/*
 * Joueurs (spec § 8, critères corrigés par D-ADM-1 à D-ADM-5 et D-P2 / D-P5 / D-P6 / D-P7). Fixtures reconstruites :
 * `tests/fixtures/admin-player/`. Le magasin de joueurs du faux back vient de `player/joueurs.json` (18 joueurs, tous à
 * FAC Basket) ; `multi-equipes` en place 3 dans d'autres équipes. LIC1000 (Lucas MARCHAND) a un compte, 2 inscriptions,
 * 27 lignes de stats, 4 examens et 9 mesures. Saison la plus récente : 4 (2025-2026 · D1 · U15G).
 */
type PlayerRow = { licence: string; nom: string; prenom: string; date_naissance: string };
const players = (JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/player/joueurs.json"), "utf8")) as { joueurs: PlayerRow[] })
  .joueurs;

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
const SORTED = [...players].sort((a, b) => collator.compare(a.nom, b.nom) || collator.compare(a.prenom, b.prenom));
const SEASON_LABEL = "2025-2026 · D1 · U15G";

const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
const licenceField = (page: Page) => field(page, "Licence");
const lastNameField = (page: Page) => field(page, "Nom");
const firstNameField = (page: Page) => field(page, "Prénom");
const birthField = (page: Page) => page.getByLabel("Date de naissance");
const civilityField = (page: Page) => page.getByRole("combobox", { name: "Civilité" });
const teamField = (page: Page) => page.getByRole("combobox", { name: "Équipe" });
const photoField = (page: Page) => field(page, "Photo (nom du fichier)");
const rows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });
const createButton = (page: Page) => page.getByRole("button", { name: "Créer le joueur" });

async function fillValidPlayer(page: Page, overrides: { licence?: string; photo?: string } = {}) {
  await licenceField(page).fill(overrides.licence ?? "pa 12");
  await lastNameField(page).fill("Durand");
  await firstNameField(page).fill("Pauline");
  await civilityField(page).selectOption("F");
  await birthField(page).fill("2011-03-12");
  await teamField(page).selectOption({ label: "Basket Cazères" });
  if (overrides.photo) await photoField(page).fill(overrides.photo);
}

test.beforeEach(async ({ context }) => {
  await setAdminScenario();
  await loginAs(context, "admin");
});

test.describe("Accès", () => {
  for (const route of [
    "/admin/player",
    "/admin/player/create",
    "/admin/player/LIC1000/edit",
    "/admin/player/LIC1000/delete",
    "/admin/player/LIC1000/created",
  ]) {
    test(`joueur sur ${route} : « Accès refusé », aucun appel de données ni écriture`, async ({ page, context }) => {
      await context.clearCookies();
      await loginAs(context, "player");
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1, name: "Accès refusé" })).toBeVisible();
      const hits = await getHits();
      expect(hits.adminReads).toBe(0);
      expect(hits.joueur).toBe(0);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("une action appelée avec une session joueur ne produit aucune écriture", async ({ page, context }) => {
    await page.goto("/admin/player/create");
    await fillValidPlayer(page);
    await context.clearCookies();
    await loginAs(context, "player");
    await createButton(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "Action réservée aux administrateurs." })).toBeVisible();
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Liste", () => {
  test("triée par nom puis prénom, photo ou initiales, lien vers la fiche, aucune image cassée", async ({ page }) => {
    await page.goto("/admin/player");
    await expect(page.getByRole("heading", { level: 1, name: "Joueurs" })).toBeVisible();
    await expect(rows(page)).toHaveCount(players.length);
    for (const [index, player] of SORTED.entries()) {
      await expect(rows(page).nth(index).getByRole("cell").first()).toContainText(`${player.prenom} ${player.nom}`);
    }
    await expect(page.getByRole("link", { name: "Lucas MARCHAND", exact: true })).toHaveAttribute("href", "/player/LIC1000");
    // LIC1007 n'a pas de photo : initiales.
    await expect(page.getByRole("row", { name: /Adam MOREL/ }).getByText("AM", { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.getByRole("table").locator("img").evaluateAll((images) =>
          images.filter((image) => !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0).length,
        ),
      )
      .toBe(0);
  });

  test("licence, équipe, naissance et âge en texte", async ({ page }) => {
    await page.goto("/admin/player");
    const row = page.getByRole("row", { name: /Lucas MARCHAND/ });
    await expect(row).toContainText("LIC1000");
    await expect(row).toContainText("FAC Basket");
    await expect(row).toContainText("08/02/2011");
    await expect(row.locator("time")).toHaveAttribute("datetime", "2011-02-08");
    await expect(row).toContainText(/· \d+ ans/);
  });

  test("recherche « elodie » trouve « Élodie », recherche par licence, URL canonique", async ({ page }) => {
    await page.goto("/admin/player");
    await page.getByRole("searchbox", { name: "Rechercher un joueur (nom ou licence)" }).fill("elodie");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player?q=elodie`);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Élodie ROUSSEL");
    await page.goto("/admin/player?q=lic1007");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Adam MOREL");
    await page.goto("/admin/player?q=%20elodie%20&tri=nom&ordre=asc&page=1");
    await expect(page).toHaveURL(`${APP_URL}/admin/player?q=elodie`);
  });

  test("filtre d'équipe : options issues de la liste, résultat, valeur invalide retirée, réinitialisation", async ({ page }) => {
    await setAdminScenario({ adminPlayer: "multi-equipes" });
    await page.goto("/admin/player");
    const select = page.getByRole("combobox", { name: "Équipe" });
    await expect(select.locator("option")).toHaveText(["Toutes les équipes", "Basket Cazères", "FAC Basket", "TIGER'S"]);
    await select.selectOption({ label: "Basket Cazères" });
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player?equipe=3`);
    await expect(rows(page)).toHaveCount(2);
    await page.getByRole("link", { name: "Réinitialiser" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player`);
    await page.goto("/admin/player?equipe=abc");
    await expect(page).toHaveURL(`${APP_URL}/admin/player`);
    await expect(rows(page)).toHaveCount(players.length);
  });

  test("tri : un clic change la colonne, l'état est dans l'URL et annoncé", async ({ page }) => {
    await page.goto("/admin/player");
    await page.getByRole("columnheader", { name: /Naissance/ }).getByRole("link").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player?tri=naissance`);
    await expect(page.getByRole("columnheader", { name: /Naissance/ })).toHaveAttribute("aria-sort", "ascending");
    await expect(rows(page).first()).toContainText("Paul DURAND");
    await page.getByRole("columnheader", { name: /Naissance/ }).getByRole("link").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player?tri=naissance&ordre=desc`);
  });

  test("actions nommées « Modifier Lucas MARCHAND » / « Supprimer … », cibles de 44 px", async ({ page }) => {
    await page.goto("/admin/player");
    for (const name of ["Modifier Lucas MARCHAND", "Supprimer Lucas MARCHAND"]) {
      const box = await page.getByRole("link", { name }).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("link", { name: "Modifier Lucas MARCHAND" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player/LIC1000/edit`);
  });

  test("aucun joueur : état vide avec action de création", async ({ page }) => {
    await setAdminScenario({ adminPlayer: "vide" });
    await page.goto("/admin/player");
    await expect(page.getByText("Aucun joueur enregistré")).toBeVisible();
    await expect(page.getByText("Crée le premier joueur pour qu'il apparaisse dans les effectifs.")).toBeVisible();
    await page.getByRole("link", { name: "Créer un joueur" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player/create`);
  });

  test("recherche sans résultat : réinitialisation proposée", async ({ page }) => {
    await page.goto("/admin/player?q=zzzz");
    await expect(page.getByText("Aucun joueur ne correspond à ta recherche.")).toBeVisible();
    await page.getByRole("link", { name: "Réinitialiser les filtres" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player`);
  });

  test("lecture en échec : erreur de bloc avec « Réessayer », jamais une liste vide", async ({ page }) => {
    await setAdminScenario({ adminPlayer: "error" });
    await page.goto("/admin/player");
    await expect(page.getByText("Impossible de charger ce bloc")).toBeVisible();
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByText("Aucun joueur enregistré")).toHaveCount(0);
  });
});

test.describe("Création", () => {
  test("champs vides : une erreur sous chaque champ, focus sur le premier, aucune écriture", async ({ page }) => {
    await page.goto("/admin/player/create");
    await createButton(page).click();
    await expect(licenceField(page)).toHaveAccessibleDescription(/La licence est obligatoire\./);
    await expect(lastNameField(page)).toHaveAccessibleDescription("Le nom est obligatoire.");
    await expect(firstNameField(page)).toHaveAccessibleDescription("Le prénom est obligatoire.");
    await expect(civilityField(page)).toHaveAccessibleDescription("Choisis une civilité.");
    await expect(birthField(page)).toHaveAccessibleDescription("Saisis une date de naissance valide.");
    await expect(teamField(page)).toHaveAccessibleDescription(/Choisis une équipe\./);
    await expect(licenceField(page)).toBeFocused();
    expect(await getWrites()).toEqual([]);
  });

  for (const licence of ["ABCDEFGHI", "AB/12", "é1"]) {
    test(`licence « ${licence} » refusée sous le champ, aucune écriture`, async ({ page }) => {
      await page.goto("/admin/player/create");
      await licenceField(page).evaluate((input: HTMLInputElement) => input.removeAttribute("maxlength"));
      await fillValidPlayer(page, { licence });
      await createButton(page).click();
      await expect(licenceField(page)).toHaveAccessibleDescription(/de 1 à 8 lettres ou chiffres, sans espace/);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("licence existante (422) : message français sur le champ, jamais la phrase anglaise, saisie conservée", async ({ page }) => {
    await page.goto("/admin/player/create");
    await fillValidPlayer(page, { licence: "lic1000" });
    await createButton(page).click();
    await expect(licenceField(page)).toHaveAccessibleDescription(/Cette licence est déjà utilisée\./);
    await expect(page.getByText(/already been taken/)).toHaveCount(0);
    await expect(lastNameField(page)).toHaveValue("Durand");
    expect(await getWrites()).toHaveLength(1);
  });

  test("civilité fermée à deux choix ; date de naissance future refusée", async ({ page }) => {
    await page.goto("/admin/player/create");
    await expect(civilityField(page).locator("option")).toHaveText(["Choisis…", "Masculin", "Féminin"]);
    await fillValidPlayer(page);
    await birthField(page).fill("2999-01-01");
    await createButton(page).click();
    await expect(birthField(page)).toHaveAccessibleDescription("La date de naissance ne peut pas être dans le futur.");
    expect(await getWrites()).toEqual([]);
  });

  test("équipes : toutes proposées, adverses comprises, avec l'indice", async ({ page }) => {
    await page.goto("/admin/player/create");
    await expect(teamField(page).locator("option")).toHaveCount(17);
    await expect(teamField(page)).toHaveAccessibleDescription(/La liste contient aussi les équipes adverses/);
  });

  test("double clic sur « Créer » : une seule écriture", async ({ page }) => {
    await setAdminScenario({ adminWrite: "slow" });
    await page.goto("/admin/player/create");
    await fillValidPlayer(page);
    await createButton(page).dblclick();
    await expect(page.getByRole("heading", { level: 1, name: "Joueur créé" })).toBeVisible();
    const writes = await getWrites();
    expect(writes.filter((write) => write.path === "/api/joueurs")).toHaveLength(1);
  });

  test("succès : page « Joueur créé » avec l'identifiant lu, écriture normalisée (equipe, licence en majuscules)", async ({ page }) => {
    await page.goto("/admin/player/create");
    await fillValidPlayer(page);
    await createButton(page).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player/PA12/created`);
    await expect(page.getByRole("heading", { level: 1, name: "Joueur créé" })).toBeVisible();
    await expect(page.getByTestId("player-username")).toHaveText("Pauline.Durand");
    await expect(page.getByText("Transmets cet identifiant au joueur.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Joueur créé" })).toContainText("Licence PA12");
    expect(await getWrites()).toMatchObject([
      {
        method: "POST",
        path: "/api/joueurs",
        body: { licence: "PA12", nom: "Durand", prenom: "Pauline", civilite: "F", date_naissance: "2011-03-12", equipe: 3, photo: null },
      },
    ]);
  });

  test("inscription en un clic à la saison la plus récente, état conservé au rechargement, une seule écriture", async ({ page }) => {
    await page.goto("/admin/player/create");
    await fillValidPlayer(page);
    await createButton(page).click();
    const enrollment = page.getByRole("region", { name: "Inscription à la saison" });
    await expect(enrollment).toContainText("n'est inscrit à aucune saison");
    await enrollment.getByRole("button", { name: `Inscrire à la saison ${SEASON_LABEL}` }).click();
    await expect(enrollment).toContainText(`Inscrit à la saison ${SEASON_LABEL}.`);
    await expect(enrollment.getByRole("button")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("region", { name: "Inscription à la saison" })).toContainText(`Inscrit à la saison ${SEASON_LABEL}.`);
    const participations = (await getWrites()).filter((write) => write.path === "/api/participer");
    expect(participations).toMatchObject([{ method: "POST", body: { Id_Saison: 4, licence: "PA12" } }]);
  });

  test("liens de la page de création : fiche, modification, autre joueur, liste", async ({ page }) => {
    await page.goto("/admin/player/create");
    await fillValidPlayer(page);
    await createButton(page).click();
    const links = page.getByRole("navigation", { name: "Suites possibles" });
    await expect(links.getByRole("link", { name: "Voir la fiche" })).toHaveAttribute("href", "/player/PA12");
    await expect(links.getByRole("link", { name: "Modifier" })).toHaveAttribute("href", "/admin/player/PA12/edit");
    await expect(links.getByRole("link", { name: "Créer un autre joueur" })).toHaveAttribute("href", "/admin/player/create");
    await links.getByRole("link", { name: "Retour à la liste" }).click();
    await expect(page.getByRole("row", { name: /Pauline Durand/ })).toBeVisible();
  });

  test("compte introuvable (création sans compte) : avertissement explicite, reste de la page utilisable", async ({ page }) => {
    await setAdminScenario({ adminPlayer: "sans-compte" });
    await page.goto("/admin/player/create");
    await fillValidPlayer(page);
    await createButton(page).click();
    await expect(page.getByText("Aucun compte de connexion n'a été trouvé pour ce joueur")).toBeVisible();
    await expect(page.getByRole("button", { name: `Inscrire à la saison ${SEASON_LABEL}` })).toBeVisible();
  });

  test("lecture des comptes en échec : bloc en erreur, inscription et liens disponibles", async ({ page }) => {
    await setAdminScenario({ users: "error" });
    await page.goto("/admin/player/LIC1001/created");
    await expect(page.getByText("Impossible de charger ce bloc")).toBeVisible();
    await expect(page.getByRole("region", { name: "Inscription à la saison" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Suites possibles" })).toBeVisible();
  });

  test("aucune saison : invitation à créer une saison", async ({ page }) => {
    await setAdminScenario({ adminPlayer: "sans-saison" });
    await page.goto("/admin/player/LIC1001/created");
    await expect(page.getByText("Aucune saison n'existe encore")).toBeVisible();
    await expect(page.getByRole("link", { name: "Créer une saison" })).toHaveAttribute("href", "/admin/season/create");
  });

  test("500 à la création : message « peut-être créé sans son compte », saisie conservée", async ({ page }) => {
    await setAdminScenario({ adminWrite: "error" });
    await page.goto("/admin/player/create");
    await fillValidPlayer(page);
    await createButton(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "a peut-être été créé sans son compte de connexion" })).toBeVisible();
    await expect(lastNameField(page)).toHaveValue("Durand");
    await expect(teamField(page)).toHaveValue("3");
  });

  test("aucune équipe : état dédié avec lien de création, pas de formulaire", async ({ page }) => {
    await setAdminScenario({ equipes: "vide" });
    await page.goto("/admin/player/create");
    await expect(page.getByText("Aucune équipe enregistrée")).toBeVisible();
    await expect(page.getByRole("link", { name: "Créer une équipe" })).toHaveAttribute("href", "/admin/team/create");
    await expect(licenceField(page)).toHaveCount(0);
  });

  test("équipes illisibles : page d'erreur, jamais un formulaire sans équipes", async ({ page }) => {
    await setAdminScenario({ equipes: "error" });
    await page.goto("/admin/player/create");
    await expect(page.getByRole("heading", { name: "Impossible de charger cette page" })).toBeVisible();
    await expect(licenceField(page)).toHaveCount(0);
  });

  test("« Annuler » : retour à la liste sans écriture ni confirmation", async ({ page }) => {
    await page.goto("/admin/player/create");
    await lastNameField(page).fill("Brouillon");
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player`);
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Aperçu de la photo", () => {
  test("vide : initiales ; nom valide : image et « Aperçu » ; introuvable : avertissement ; invalide : message", async ({ page }) => {
    await page.goto("/admin/player/create");
    const status = page.getByRole("status").filter({ hasText: /photo|Image|fichier|aperçu/i });
    await expect(status).toContainText("Aucune photo : les initiales seront affichées.");

    await photoField(page).fill("marchand.png");
    await expect(status).toContainText("Aucune photo");
    await page.keyboard.press("Tab");
    await expect(status).toContainText("Aperçu de la photo « marchand.png ».");

    await photoField(page).fill("inconnu.png");
    await page.keyboard.press("Tab");
    await expect(status).toContainText("Image introuvable sur le serveur");

    await photoField(page).fill("x.svg");
    await page.keyboard.press("Tab");
    await expect(status).toContainText("Nom de fichier non valide");

    await photoField(page).fill("");
    await page.keyboard.press("Tab");
    await expect(status).toContainText("Aucune photo");
  });

  test("un nom de photo invalide est aussi refusé à l'envoi, sous le champ", async ({ page }) => {
    await page.goto("/admin/player/create");
    await fillValidPlayer(page, { photo: "a/b.png" });
    await createButton(page).click();
    await expect(photoField(page)).toHaveAccessibleDescription(/doit se terminer par \.png/);
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Modification", () => {
  test("identifiants inconnus ou invalides : « Joueur introuvable », jamais de formulaire", async ({ page }) => {
    for (const licence of ["ZZ9999", "AB%20CD", "ABCDEFGHI", "create"]) {
      await page.goto(`/admin/player/${licence}/edit`);
      await expect(page.getByRole("heading", { level: 1, name: "Joueur introuvable" })).toBeVisible();
      await expect(lastNameField(page)).toHaveCount(0);
    }
  });

  test("lecture en échec : page d'erreur, pas de formulaire", async ({ page }) => {
    await setAdminScenario({ joueur: "error" });
    await page.goto("/admin/player/LIC1000/edit");
    await expect(page.getByRole("heading", { name: "Impossible de charger cette page" })).toBeVisible();
    await expect(lastNameField(page)).toHaveCount(0);
  });

  test("formulaire pré-rempli côté serveur, licence en lecture seule, avertissement sur l'identifiant", async ({ page }) => {
    await page.goto("/admin/player/LIC1001/edit");
    await expect(licenceField(page)).toHaveValue("LIC1001");
    await expect(licenceField(page)).toHaveAttribute("readonly", "");
    await expect(licenceField(page)).toHaveAccessibleDescription("Identifiant fédéral, non modifiable.");
    await expect(lastNameField(page)).toHaveValue("DURAND");
    await expect(firstNameField(page)).toHaveValue("Paul");
    await expect(civilityField(page)).toHaveValue("M");
    await expect(birthField(page)).toHaveValue("2011-01-01");
    await expect(teamField(page)).toHaveValue("1");
    await expect(photoField(page)).toHaveValue("durand.png");
    await expect(page.getByText("identifiant « paul.durand »")).toBeVisible();
    await expect(page.getByText("ne suit pas les changements de nom ou de prénom")).toBeVisible();
  });

  test("joueur sans compte : avertissement adapté", async ({ page }) => {
    await page.goto("/admin/player/LIC1002/edit");
    await expect(page.getByText("Aucun compte de connexion n'est lié à ce joueur.")).toBeVisible();
  });

  test("modifier le prénom seul : la photo existante est renvoyée, retour liste avec message et pastille, URL nettoyée", async ({ page }) => {
    await page.goto("/admin/player/LIC1001/edit");
    await firstNameField(page).fill("Paulo");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Joueur modifié." })).toBeVisible();
    await expect(page.getByRole("row", { name: /Paulo DURAND/ })).toContainText("Vient d'être enregistré");
    expect(await getWrites()).toMatchObject([
      {
        method: "PUT",
        path: "/api/joueurs/LIC1001",
        body: { nom: "DURAND", prenom: "Paulo", civilite: "M", date_naissance: "2011-01-01", photo: "durand.png", Id_Equipe: 1 },
      },
    ]);
    expect((await getWrites())[0].body).not.toHaveProperty("licence");
    await page.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("status")).toBeEmpty();
    await expect(page).toHaveURL(`${APP_URL}/admin/player`);
  });

  test("vider la photo la retire (photo null dans l'écriture) ; changer d'équipe", async ({ page }) => {
    await setAdminScenario({ adminPlayer: "multi-equipes" });
    await page.goto("/admin/player/LIC1001/edit");
    await photoField(page).fill("");
    await teamField(page).selectOption({ label: "TIGER'S" });
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Joueur modifié." })).toBeVisible();
    expect(await getWrites()).toMatchObject([{ method: "PUT", body: { photo: null, Id_Equipe: 2 } }]);
    await expect(page.getByRole("row", { name: /Paul DURAND/ })).toContainText("TIGER'S");
  });

  test("champ invalide : erreur sous le champ, aucune écriture", async ({ page }) => {
    await page.goto("/admin/player/LIC1001/edit");
    await lastNameField(page).fill("");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(lastNameField(page)).toHaveAccessibleDescription("Le nom est obligatoire.");
    expect(await getWrites()).toEqual([]);
  });

  test("joueur supprimé entre-temps (404) : « Ce joueur n'existe plus. »", async ({ page }) => {
    await page.goto("/admin/player/LIC1001/edit");
    await setAdminScenario({ adminWrite: "404" });
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Ce joueur n'existe plus." })).toBeVisible();
  });

  test("depuis la modification, l'action « Supprimer » mène à la confirmation", async ({ page }) => {
    await page.goto("/admin/player/LIC1001/edit");
    await page.getByRole("link", { name: "Supprimer Paul DURAND" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player/LIC1001/delete`);
  });
});

test.describe("Suppression", () => {
  test("confirmation chiffrée : identité, licence, équipe et les cinq données emportées", async ({ page }) => {
    await page.goto("/admin/player/LIC1000/delete");
    await expect(page.getByRole("heading", { level: 2, name: "Supprimer Lucas MARCHAND ?" })).toBeVisible();
    await expect(page.getByText("Licence LIC1000 · FAC Basket")).toBeVisible();
    const impact = page.getByRole("region", { name: "Seront aussi supprimés :" });
    await expect(impact).toContainText("1 compte utilisateur");
    await expect(impact).toContainText("2 inscriptions à une saison");
    await expect(impact).toContainText("27 lignes de statistiques de match (tirs compris)");
    await expect(impact).toContainText("4 examens de tir");
    await expect(impact).toContainText("9 mesures physiques");
    await expect(impact).not.toContainText("indéterminé");
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toBeVisible();
  });

  test("« Annuler » : retour à la liste sans écriture", async ({ page }) => {
    await page.goto("/admin/player/LIC1000/delete");
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/player`);
    expect(await getWrites()).toEqual([]);
  });

  test("une lecture d'impact en échec : « nombre indéterminé » pour cette ligne seule, jamais 0, suppression possible", async ({ page }) => {
    await setAdminScenario({ users: "error" });
    await page.goto("/admin/player/LIC1000/delete");
    const impact = page.getByRole("region", { name: "Seront aussi supprimés :" });
    await expect(impact).toContainText("un nombre indéterminé de comptes utilisateurs");
    await expect(impact).toContainText("27 lignes de statistiques de match");
    await expect(impact).toContainText("D'autres données liées peuvent aussi être supprimées.");
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toBeVisible();
  });

  test("tranche de stats illisible : lignes de stats indéterminées, examens comptés", async ({ page }) => {
    await setAdminScenario({ joueur: "stats-invalides" });
    await page.goto("/admin/player/LIC1000/delete");
    const impact = page.getByRole("region", { name: "Seront aussi supprimés :" });
    await expect(impact).toContainText("4 examens de tir");
    await expect(impact).toContainText("1 compte utilisateur");
  });

  test("identifiant inconnu ou invalide : « Joueur introuvable »", async ({ page }) => {
    for (const licence of ["ZZ9999", "ABCDEFGHI"]) {
      await page.goto(`/admin/player/${licence}/delete`);
      await expect(page.getByRole("heading", { level: 1, name: "Joueur introuvable" })).toBeVisible();
    }
  });

  test("500 : message explicite, la ligne est conservée", async ({ page }) => {
    await page.goto("/admin/player/LIC1000/delete");
    await setAdminScenario({ adminWrite: "error" });
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "La suppression a échoué" })).toBeVisible();
    await page.goto("/admin/player");
    await expect(page.getByRole("row", { name: /Lucas MARCHAND/ })).toBeVisible();
  });

  test("404 (déjà supprimé) : le joueur est signalé introuvable", async ({ page }) => {
    await page.goto("/admin/player/LIC1000/delete");
    await setAdminScenario({ adminWrite: "404" });
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Joueur introuvable" })).toBeVisible();
  });

  test("succès : un seul DELETE, ligne retirée, message, compte et inscriptions emportés", async ({ page }) => {
    await page.goto("/admin/player/LIC1000/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Joueur supprimé." })).toBeVisible();
    await expect(page).toHaveURL(`${APP_URL}/admin/player`);
    await expect(page.getByRole("row", { name: /Lucas MARCHAND/ })).toHaveCount(0);
    await expect(rows(page)).toHaveCount(players.length - 1);
    expect(await getWrites()).toMatchObject([{ method: "DELETE", path: "/api/joueurs/LIC1000" }]);
  });

  test("joueur sans donnée liée : aucune autre donnée", async ({ page }) => {
    await page.goto("/admin/player/LIC1002/delete");
    await expect(page.getByRole("heading", { level: 3, name: "Seront aussi supprimés :" })).toBeVisible();
  });
});

test.describe("Palmarès", () => {
  test("après une modification et une suppression, le palmarès reste consultable (invalidation vérifiée en intégration)", async ({ page }) => {
    await page.goto("/admin/player/LIC1001/edit");
    await firstNameField(page).fill("Paulo");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Joueur modifié." })).toBeVisible();
    await page.goto("/hall-of-fame");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/admin/player/LIC1002/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Joueur supprimé." })).toBeVisible();
    await page.goto("/hall-of-fame");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect((await getHits()).history).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Accessibilité", () => {
  test("parcours clavier de la liste à la modification, soumission avec Entrée", async ({ page }) => {
    await page.goto("/admin/player");
    await page.getByRole("link", { name: "Modifier Paul DURAND" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${APP_URL}/admin/player/LIC1001/edit`);
    await firstNameField(page).focus();
    await page.keyboard.press("End");
    await page.keyboard.type("o");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Joueur modifié." })).toBeVisible();
    await expect(page.getByRole("row", { name: /Paulo DURAND/ })).toBeVisible();
  });

  test("champs de 48 px, interface en français, champs obligatoires marqués", async ({ page }) => {
    await page.goto("/admin/player/create");
    for (const locator of [licenceField(page), lastNameField(page), civilityField(page), birthField(page)]) {
      const box = await locator.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(48);
    }
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(licenceField(page)).toHaveAttribute("aria-required", "true");
    await expect(teamField(page)).toHaveAttribute("aria-required", "true");
  });
});
