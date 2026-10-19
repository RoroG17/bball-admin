import { expect, test, type Page } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "../../lib/sessionCookie";
import { signSessionToken } from "../../lib/sessionToken";
import { APP_URL, E2E_SESSION_SECRET, getHits, getWrites, loginAs, setAdminScenario } from "./helpers";

/*
 * Comptes (spec § 8, critères corrigés par D-ADM-1 à D-ADM-5 et D-U2 à D-U6). Fixtures reconstruites :
 * `tests/fixtures/admin-user/`. Magasin du faux back (admin-team/users.json) : admin, lucas.marchand (LIC1000, mot de
 * passe défini), paul.durand (LIC1001, non défini), elodie.roussel (LIC2000), compte.sans.joueur (non défini). Les 18
 * joueurs de `player/joueurs.json` alimentent le sélecteur : 15 n'ont pas de compte. Scénario `historiques` ajoute
 * « Jean Pierre.Martin » (espace) et « Admin » + espace (identifiant ambigu).
 */
const rows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });
const usernameField = (page: Page) => page.getByRole("textbox", { name: "Identifiant", exact: true });
const createButton = (page: Page) => page.getByRole("button", { name: "Créer le compte" });
const confirmButton = (page: Page, name: string) => page.getByRole("button", { name });
const notice = (page: Page, text: string) => page.getByRole("status").filter({ hasText: text });

/** Remplace le nom caché du formulaire de confirmation, une fois la page hydratée (sinon React ré-applique la valeur du serveur). */
async function forgeTarget(page: Page, value: string) {
  await page.waitForFunction(() => {
    const input = document.querySelector('input[type="hidden"][name="username"]');
    return input !== null && Object.keys(input).some((key) => key.startsWith("__reactProps$"));
  });
  await page.locator('input[type="hidden"][name="username"]').evaluate((input: HTMLInputElement, forged: string) => {
    input.value = forged;
  }, value);
}

test.beforeEach(async ({ context }) => {
  await setAdminScenario();
  await loginAs(context, "admin");
});

test.describe("Accès (P1)", () => {
  for (const route of [
    "/admin/user",
    "/admin/user/create",
    "/admin/user/paul.durand/reset",
    "/admin/user/paul.durand/delete",
    "/admin/user/admin/delete",
  ]) {
    test(`joueur sur ${route} : « Accès refusé », zéro appel à /api/users, aucune écriture`, async ({ page, context }) => {
      await context.clearCookies();
      await loginAs(context, "player");
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1, name: "Accès refusé" })).toBeVisible();
      expect((await getHits()).adminReads).toBe(0);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("visiteur : retour à la connexion", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/admin/user");
    await expect(page).toHaveURL(/\/login/);
    expect((await getHits()).adminReads).toBe(0);
  });

  test("compte « Admin » (ambigu) : joueur, donc « Accès refusé »", async ({ page, context }) => {
    await context.clearCookies();
    const value = await signSessionToken({ username: "Admin ", licence: null, token: "e2e" }, E2E_SESSION_SECRET);
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value, url: APP_URL }]);
    await page.goto("/admin/user");
    await expect(page.getByRole("heading", { level: 1, name: "Accès refusé" })).toBeVisible();
    expect((await getHits()).adminReads).toBe(0);
  });

  test("une action appelée avec une session joueur ne produit aucune écriture", async ({ page, context }) => {
    await page.goto("/admin/user/paul.durand/delete");
    await context.clearCookies();
    await loginAs(context, "player");
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(page.getByRole("alert").filter({ hasText: "Action réservée aux administrateurs." })).toBeVisible();
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Liste", () => {
  test("colonnes, tri par défaut (joueurs par nom, comptes sans joueur à la fin), statut du mot de passe en texte", async ({ page }) => {
    await page.goto("/admin/user");
    await expect(page.getByRole("heading", { level: 1, name: "Utilisateurs" })).toBeVisible();
    for (const header of ["Identifiant", "Joueur", "Équipe", "Mot de passe", "Remarques"]) {
      await expect(page.getByRole("columnheader", { name: new RegExp(header) })).toBeVisible();
    }
    await expect(rows(page)).toHaveCount(5);
    const first = rows(page).nth(0);
    await expect(first).toContainText("paul.durand");
    await expect(first).toContainText("Paul DURAND");
    await expect(first).toContainText("FAC Basket");
    await expect(first).toContainText("Non défini");
    await expect(rows(page).nth(1)).toContainText("lucas.marchand");
    await expect(rows(page).nth(1)).toContainText("Défini");
    await expect(rows(page).nth(2)).toContainText("elodie.roussel");
    await expect(rows(page).nth(3)).toContainText("admin");
    await expect(rows(page).nth(4)).toContainText("compte.sans.joueur");
    await expect(rows(page).nth(4)).toContainText("Aucun joueur");
    await expect(page.getByRole("link", { name: "Paul DURAND", exact: true })).toHaveAttribute("href", "/player/LIC1001");
    await expect(page.locator("code", { hasText: "paul.durand" })).toBeVisible();
  });

  test("has_password en chaînes : « 0 » est « Non défini » (P9)", async ({ page }) => {
    await setAdminScenario({ users: "chaines" });
    await page.goto("/admin/user");
    await expect(page.getByRole("row", { name: /paul\.durand/ })).toContainText("Non défini");
    await expect(page.getByRole("row", { name: /lucas\.marchand/ })).toContainText("Défini");
    await expect(page.getByRole("row", { name: /lucas\.marchand/ })).not.toContainText("Non défini");
  });

  test("has_password invalide : le bloc est en erreur, jamais un « défini » trompeur", async ({ page }) => {
    await setAdminScenario({ users: "invalide" });
    await page.goto("/admin/user");
    await expect(page.getByText("Impossible de charger ce bloc")).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("anomalies : compte sans joueur « Non rattaché », « Admin » « Identifiant ambigu », admin « Administrateur »", async ({ page }) => {
    await setAdminScenario({ users: "historiques" });
    await page.goto("/admin/user");
    await expect(page.getByRole("row", { name: /^admin / }).getByText("Administrateur")).toBeVisible();
    const ambiguous = rows(page).filter({ hasText: "Identifiant ambigu" });
    await expect(ambiguous).toHaveCount(1);
    await expect(ambiguous).toContainText("Non rattaché");
    await page.goto("/admin/user?statut=non-rattache");
    await expect(rows(page)).toHaveCount(1);
  });

  test("compte sans joueur du magasin par défaut : « Non rattaché »", async ({ page }) => {
    await page.goto("/admin/user");
    await expect(page.getByRole("row", { name: /compte\.sans\.joueur/ })).toContainText("Non rattaché");
    await expect(page.getByRole("row", { name: /paul\.durand/ })).not.toContainText("Non rattaché");
  });

  test("recherche sans accent (« elodie » trouve « Élodie »), par équipe et par identifiant, URL canonique", async ({ page }) => {
    await page.goto("/admin/user");
    await page.getByRole("searchbox", { name: "Rechercher un compte" }).fill("elodie");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user?q=elodie`);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Élodie ROUSSEL");
    await page.goto("/admin/user?q=fac");
    await expect(rows(page)).toHaveCount(3);
    await page.goto("/admin/user?q=compte.sans");
    await expect(rows(page)).toHaveCount(1);
    await page.goto("/admin/user?q=%20elodie%20&tri=joueur&ordre=asc&page=1");
    await expect(page).toHaveURL(`${APP_URL}/admin/user?q=elodie`);
  });

  test("filtre « Mot de passe non défini » : dans l'URL, valeur invalide retirée, réinitialisation", async ({ page }) => {
    await page.goto("/admin/user");
    const select = page.getByRole("combobox", { name: "Afficher" });
    await expect(select.locator("option")).toHaveText(["Tous les comptes", "Mot de passe non défini", "Sans joueur rattaché"]);
    await select.selectOption({ label: "Mot de passe non défini" });
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user?statut=sans-mot-de-passe`);
    await expect(rows(page)).toHaveCount(2);
    await page.getByRole("link", { name: "Réinitialiser", exact: true }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    await page.goto("/admin/user?statut=nimporte");
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    await expect(rows(page)).toHaveCount(5);
  });

  test("tri : un clic change la colonne, l'état est dans l'URL et annoncé", async ({ page }) => {
    await page.goto("/admin/user");
    await page.getByRole("columnheader", { name: /Identifiant/ }).getByRole("link").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user?tri=identifiant`);
    await expect(page.getByRole("columnheader", { name: /Identifiant/ })).toHaveAttribute("aria-sort", "ascending");
    await expect(rows(page).first()).toContainText("admin");
    await page.getByRole("columnheader", { name: /Identifiant/ }).getByRole("link").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user?tri=identifiant&ordre=desc`);
    await expect(rows(page).first()).toContainText("paul.durand");
  });

  test("squelette pendant le chargement", async ({ page }) => {
    await setAdminScenario({ users: "lent" });
    await page.goto("/admin/user", { waitUntil: "commit" });
    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible();
    await expect(rows(page)).toHaveCount(5);
  });

  test("lecture en échec : erreur de bloc avec « Réessayer », jamais une liste vide", async ({ page }) => {
    await setAdminScenario({ users: "error" });
    await page.goto("/admin/user");
    await expect(page.getByText("Impossible de charger ce bloc")).toBeVisible();
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByText("Aucun compte", { exact: true })).toHaveCount(0);
  });

  test("aucun compte : état vide avec action de création", async ({ page }) => {
    await setAdminScenario({ users: "vide" });
    await page.goto("/admin/user");
    await expect(page.getByText("Aucun compte", { exact: true })).toBeVisible();
    await expect(page.getByText("Les comptes des joueurs sont créés avec les joueurs.")).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Nouveau compte" }).last().click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user/create`);
  });

  test("recherche sans résultat : réinitialisation proposée", async ({ page }) => {
    await page.goto("/admin/user?q=zzzz");
    await expect(page.getByText("Aucun compte ne correspond à ta recherche.")).toBeVisible();
    await page.getByRole("link", { name: "Réinitialiser les filtres" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
  });

  test("actions nommées « Réinitialiser Paul DURAND » / « Supprimer … », cibles de 44 px", async ({ page }) => {
    await page.goto("/admin/user");
    for (const name of ["Réinitialiser Paul DURAND", "Supprimer Paul DURAND", "Réinitialiser compte.sans.joueur"]) {
      const box = await page.getByRole("link", { name }).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("Création", () => {
  test("le sélecteur ne propose pas les joueurs qui ont déjà un compte, sans <select> géant", async ({ page }) => {
    await page.goto("/admin/user/create");
    await expect(page.getByRole("heading", { level: 1, name: "Nouveau compte" })).toBeVisible();
    await expect(page.getByText("15 joueurs sans compte")).toBeVisible();
    await expect(page.getByRole("link", { name: "Hugo FAURE, FAC Basket" })).toBeVisible();
    for (const taken of ["Paul DURAND", "Lucas MARCHAND", "Élodie ROUSSEL"]) {
      await expect(page.getByRole("link", { name: new RegExp(taken) })).toHaveCount(0);
    }
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByText("Un joueur sans équipe n'apparaît pas dans cette liste.")).toBeVisible();
  });

  test("recherche d'un joueur dans l'URL, puis choix : identifiant pré-rempli et modifiable, avertissement « non rattaché »", async ({ page }) => {
    await page.goto("/admin/user/create");
    await page.getByRole("searchbox", { name: "Rechercher un joueur" }).fill("faure");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user/create?q=faure`);
    await page.getByRole("link", { name: "Hugo FAURE, FAC Basket" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user/create?q=faure&joueur=LIC1002`);
    await expect(page.getByRole("link", { name: "Hugo FAURE, FAC Basket" })).toHaveAttribute("aria-current", "true");
    await expect(page.getByText("Joueur choisi : Hugo FAURE (FAC Basket)")).toBeVisible();
    await expect(usernameField(page)).toHaveValue("hugo.faure");
    await expect(page.getByText("le serveur n'enregistre pas le lien avec le joueur")).toBeVisible();
    await usernameField(page).fill("hugo.f");
    await expect(usernameField(page)).toHaveValue("hugo.f");
    // Changer de joueur remplace la suggestion.
    await page.getByRole("link", { name: "Changer de joueur" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user/create?q=faure`);
    await expect(usernameField(page)).toHaveValue("");
    await expect(page.getByText("Sans joueur choisi, le compte ne sera rattaché à personne.")).toBeVisible();
  });

  test("URL du sélecteur : forme canonique imposée, joueur indisponible signalé", async ({ page }) => {
    await page.goto("/admin/user/create?q=%20faure%20&joueur=a%20b");
    await expect(page).toHaveURL(`${APP_URL}/admin/user/create?q=faure`);
    await page.goto("/admin/user/create?joueur=LIC1000");
    await expect(page.getByText("Ce joueur n'est pas disponible : il a déjà un compte ou n'existe plus.")).toBeVisible();
    await expect(usernameField(page)).toHaveValue("");
  });

  test("recherche sans résultat dans le sélecteur", async ({ page }) => {
    await page.goto("/admin/user/create?q=zzzz");
    await expect(page.getByText("Aucun joueur ne correspond à « zzzz ».")).toBeVisible();
  });

  for (const [username, message] of [
    ["admin", "Cet identifiant est réservé. Choisis-en un autre."],
    ["Admin", "Cet identifiant est réservé. Choisis-en un autre."],
    ["admin ", "sans espace"],
    ["paul durand", "sans espace"],
    ["", "Saisis un identifiant."],
  ] as const) {
    test(`identifiant « ${username} » : erreur sous le champ, focus, aucune écriture`, async ({ page }) => {
      await page.goto("/admin/user/create");
      await usernameField(page).fill(username);
      await createButton(page).click();
      await expect(usernameField(page)).toHaveAccessibleDescription(new RegExp(message));
      await expect(usernameField(page)).toBeFocused();
      await expect(usernameField(page)).toHaveValue(username);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("identifiant de 65 caractères refusé à l'envoi (maxlength retiré), aucune écriture", async ({ page }) => {
    await page.goto("/admin/user/create");
    await usernameField(page).evaluate((input: HTMLInputElement) => input.removeAttribute("maxlength"));
    await usernameField(page).fill("a".repeat(65));
    await createButton(page).click();
    await expect(usernameField(page)).toHaveAccessibleDescription(/L.identifiant fait 64 caractères au maximum.$/);
    expect(await getWrites()).toEqual([]);
  });

  test("identifiant déjà utilisé (422) : message français, jamais la phrase anglaise, saisie conservée", async ({ page }) => {
    await page.goto("/admin/user/create");
    await usernameField(page).fill("lucas.marchand");
    await createButton(page).click();
    await expect(usernameField(page)).toHaveAccessibleDescription(/Cet identifiant est déjà utilisé.$/);
    await expect(page.getByText(/already been taken/)).toHaveCount(0);
    await expect(usernameField(page)).toHaveValue("lucas.marchand");
    expect(await getWrites()).toMatchObject([{ method: "POST", path: "/api/users", body: { username: "lucas.marchand" } }]);
  });

  test("double clic sur « Créer le compte » : une seule écriture", async ({ page }) => {
    await setAdminScenario({ adminWrite: "slow" });
    await page.goto("/admin/user/create");
    await usernameField(page).fill("nouveau.compte");
    await createButton(page).dblclick();
    await expect(notice(page, "créé.")).toBeVisible();
    const writes = await getWrites();
    expect(writes.filter((write) => write.path === "/api/users")).toHaveLength(1);
  });

  test("succès : message, ligne surlignée, identifiant à communiquer, compte sans joueur signalé", async ({ page }) => {
    await page.goto("/admin/user/create");
    await usernameField(page).fill("nouveau.compte");
    await createButton(page).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    await expect(notice(page, "Compte « nouveau.compte » créé.")).toBeVisible();
    await expect(page.getByText("Identifiant à communiquer à nouveau.compte : nouveau.compte.")).toBeVisible();
    await expect(page.getByText("Ce compte n'est rattaché à aucun joueur : il ne donnera accès à aucune saison.")).toBeVisible();
    const row = page.getByRole("row", { name: /nouveau\.compte/ });
    await expect(row).toContainText("Vient d'être enregistré");
    await expect(row).toContainText("Non défini");
    await expect(row).toContainText("Non rattaché");
    expect(await getWrites()).toMatchObject([{ method: "POST", path: "/api/users", body: { username: "nouveau.compte" } }]);
  });

  test("avec un joueur choisi : le joueur est envoyé, mais le serveur ne l'enregistre pas (B6) : compte « Non rattaché »", async ({ page }) => {
    await page.goto("/admin/user/create?joueur=LIC1002");
    await usernameField(page).fill("hugo.faure");
    await createButton(page).click();
    await expect(notice(page, "Compte « hugo.faure » créé.")).toBeVisible();
    expect(await getWrites()).toMatchObject([
      { method: "POST", path: "/api/users", body: { username: "hugo.faure", joueur: "LIC1002" } },
    ]);
    await expect(page.getByRole("row", { name: /hugo\.faure/ })).toContainText("Aucun joueur");
    await expect(page.getByRole("row", { name: /hugo\.faure/ })).toContainText("Non rattaché");
  });

  test("joueurs illisibles : bloc en erreur, jamais un choix vide ni un formulaire", async ({ page }) => {
    await setAdminScenario({ joueurs: "error" });
    await page.goto("/admin/user/create");
    await expect(page.getByText("Impossible de charger ce bloc")).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer le compte" })).toHaveCount(0);
  });

  test("500 : message d'écriture, saisie conservée", async ({ page }) => {
    await setAdminScenario({ adminWrite: "error" });
    await page.goto("/admin/user/create");
    await usernameField(page).fill("nouveau.compte");
    await createButton(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "Le serveur a refusé l'opération." })).toBeVisible();
    await expect(usernameField(page)).toHaveValue("nouveau.compte");
  });

  test("« Annuler » : retour à la liste sans écriture", async ({ page }) => {
    await page.goto("/admin/user/create");
    await usernameField(page).fill("abandon");
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Réinitialisation", () => {
  test("page de confirmation : joueur, identifiant, conséquences ; « Annuler » sans écriture", async ({ page }) => {
    await page.goto("/admin/user/lucas.marchand/reset");
    await expect(page.getByRole("heading", { level: 1, name: "Réinitialiser le mot de passe" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Réinitialiser le mot de passe de Lucas MARCHAND ?" })).toBeVisible();
    await expect(page.getByText("Identifiant : lucas.marchand")).toBeVisible();
    await expect(page.getByText("Le mot de passe actuel sera effacé immédiatement.")).toBeVisible();
    await expect(page.getByText("saisira son identifiant seul puis choisira un nouveau mot de passe")).toBeVisible();
    await expect(page.getByText("Les appareils déjà connectés le restent")).toBeVisible();
    await expect(page.getByRole("button", { name: "Réinitialiser le mot de passe" })).not.toBeFocused();
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    expect(await getWrites()).toEqual([]);
  });

  test("succès : un seul PUT sans corps, message, le statut devient « Non défini »", async ({ page }) => {
    await page.goto("/admin/user");
    await expect(page.getByRole("row", { name: /lucas\.marchand/ })).toContainText("Défini");
    await page.getByRole("link", { name: "Réinitialiser Lucas MARCHAND" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user/lucas.marchand/reset`);
    await confirmButton(page, "Réinitialiser le mot de passe").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    await expect(notice(page, "Mot de passe réinitialisé.")).toBeVisible();
    await expect(page.getByRole("row", { name: /lucas\.marchand/ })).toContainText("Non défini");
    const writes = await getWrites();
    expect(writes).toMatchObject([{ method: "PUT", path: "/api/users/lucas.marchand" }]);
    expect(writes[0].body).toBeUndefined();
  });

  test("compte supprimé entre-temps (404) : « Ce compte n'existe plus »", async ({ page }) => {
    await page.goto("/admin/user/lucas.marchand/reset");
    await setAdminScenario({ adminWrite: "404" });
    await confirmButton(page, "Réinitialiser le mot de passe").click();
    await expect(page.getByRole("alert").filter({ hasText: "Ce compte n'existe plus." })).toBeVisible();
  });

  test("500 : message d'écriture explicite", async ({ page }) => {
    await page.goto("/admin/user/lucas.marchand/reset");
    await setAdminScenario({ adminWrite: "error" });
    await confirmButton(page, "Réinitialiser le mot de passe").click();
    await expect(page.getByRole("alert").filter({ hasText: "Le serveur a refusé l'opération." })).toBeVisible();
  });

  test("compte inconnu : « Compte introuvable », jamais de formulaire", async ({ page }) => {
    await page.goto("/admin/user/inconnu/reset");
    await expect(page.getByRole("heading", { level: 1, name: "Compte introuvable" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
  });

  test("lecture de la liste en échec : erreur de bloc, aucun bouton", async ({ page }) => {
    await setAdminScenario({ users: "error" });
    await page.goto("/admin/user/lucas.marchand/reset");
    await expect(page.getByText("Impossible de charger ce bloc")).toBeVisible();
    await expect(page.getByRole("button", { name: "Réinitialiser le mot de passe" })).toHaveCount(0);
  });
});

test.describe("Suppression", () => {
  test("confirmation : conséquences (joueur conservé, sessions non coupées, journaux) ; « Annuler » sans écriture", async ({ page }) => {
    await page.goto("/admin/user/paul.durand/delete");
    await expect(page.getByRole("heading", { level: 2, name: "Supprimer le compte de Paul DURAND ?" })).toBeVisible();
    await expect(page.getByText("Identifiant : paul.durand")).toBeVisible();
    await expect(page.getByText("Cette suppression est définitive.")).toBeVisible();
    await expect(page.getByText("Le joueur Paul DURAND et toutes ses statistiques sont conservés")).toBeVisible();
    await expect(page.getByText(/jusqu'à l'expiration de leur session/)).toBeVisible();
    await expect(page.getByText(/perdent leur auteur/)).toBeVisible();
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    expect(await getWrites()).toEqual([]);
  });

  test("compte sans joueur : « n'est rattaché à aucun joueur »", async ({ page }) => {
    await page.goto("/admin/user/compte.sans.joueur/delete");
    await expect(page.getByText("Ce compte n'est rattaché à aucun joueur.")).toBeVisible();
  });

  test("succès : un seul DELETE, ligne retirée, message, joueur conservé", async ({ page }) => {
    await page.goto("/admin/user");
    await page.getByRole("link", { name: "Supprimer Paul DURAND" }).click();
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    await expect(notice(page, "Compte supprimé.")).toBeVisible();
    await expect(page.getByRole("row", { name: /paul\.durand/ })).toHaveCount(0);
    await expect(rows(page)).toHaveCount(4);
    expect(await getWrites()).toMatchObject([{ method: "DELETE", path: "/api/users/paul.durand" }]);
    await page.goto("/admin/player");
    await expect(page.getByRole("row", { name: /Paul DURAND/ })).toBeVisible();
  });

  test("404 (déjà supprimé) : la page de confirmation relue annonce « Compte introuvable », ligne retirée de la liste", async ({ page }) => {
    await page.goto("/admin/user/paul.durand/delete");
    await setAdminScenario({ adminWrite: "404" });
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(page.getByRole("heading", { level: 1, name: "Compte introuvable" })).toBeVisible();
    await page.goto("/admin/user");
    await expect(page.getByRole("row", { name: /paul\.durand/ })).toHaveCount(0);
  });

  test("500 : message explicite, la ligne est conservée", async ({ page }) => {
    await page.goto("/admin/user/paul.durand/delete");
    await setAdminScenario({ adminWrite: "error" });
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(page.getByRole("alert").filter({ hasText: "La suppression a échoué" })).toBeVisible();
    await page.goto("/admin/user");
    await expect(page.getByRole("row", { name: /paul\.durand/ })).toBeVisible();
  });

  test("un compte ambigu « Admin » reste supprimable, sous son nom exact, sans toucher à « admin »", async ({ page }) => {
    await setAdminScenario({ users: "historiques" });
    await page.goto("/admin/user");
    const ambiguous = page.locator('a[href="/admin/user/Admin%20/delete"]');
    await expect(ambiguous).toBeVisible();
    await ambiguous.click();
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(notice(page, "Compte supprimé.")).toBeVisible();
    await expect(page.locator('a[href="/admin/user/Admin%20/delete"]')).toHaveCount(0);
    await expect(page.getByRole("row", { name: /^admin / })).toBeVisible();
    expect(await getWrites()).toMatchObject([{ method: "DELETE", path: "/api/users/Admin%20" }]);
  });
});

test.describe("Protections (P3)", () => {
  test("la ligne « admin » (compte connecté) n'a aucun bouton : « Compte protégé »", async ({ page }) => {
    await page.goto("/admin/user");
    const row = page.getByRole("row", { name: /^admin / });
    await expect(row).toContainText("Compte protégé");
    await expect(row).toContainText("Administrateur");
    await expect(row.getByRole("link", { name: /Réinitialiser|Supprimer/ })).toHaveCount(0);
    await expect(page.locator('a[href^="/admin/user/admin/"]')).toHaveCount(0);
  });

  for (const action of ["reset", "delete"]) {
    test(`/admin/user/admin/${action} tapé à la main : message de protection, pas de formulaire`, async ({ page }) => {
      await page.goto(`/admin/user/admin/${action}`);
      await expect(page.getByRole("alert").filter({ hasText: "Tu ne peux pas réinitialiser ni supprimer ton propre compte." })).toBeVisible();
      await expect(page.getByRole("link", { name: "Retour à la liste" })).toBeVisible();
      await expect(page.getByRole("main").locator("form")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Supprimer définitivement|Réinitialiser le mot de passe/ })).toHaveCount(0);
      expect(await getWrites()).toEqual([]);
    });
  }

  for (const forged of ["ADMIN", "Admin", "admin ", "paul.durand "]) {
    for (const [action, label] of [
      ["delete", "Supprimer définitivement"],
      ["reset", "Réinitialiser le mot de passe"],
    ] as const) {
      test(`cible forgée « ${forged} » (${action}) : compte inexistant en égalité stricte, aucune écriture`, async ({ page }) => {
        await page.goto(`/admin/user/paul.durand/${action}`);
        await forgeTarget(page, forged);
        await confirmButton(page, label).click();
        await expect(page.getByRole("alert").filter({ hasText: "Ce compte n'existe plus." })).toBeVisible();
        expect((await getWrites()).filter((write) => write.method !== "GET")).toEqual([]);
      });
    }
  }

  test("cible forgée « admin » (le compte connecté) : refus explicite, aucune écriture", async ({ page }) => {
    await page.goto("/admin/user/paul.durand/delete");
    await forgeTarget(page, "admin");
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(page.getByRole("alert").filter({ hasText: "Tu ne peux pas réinitialiser ni supprimer ton propre compte." })).toBeVisible();
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Identifiant avec espace (point de décodage unique)", () => {
  test("/admin/user/Jean%20Pierre.Martin/reset affiche le bon compte et écrit sous le nom exact", async ({ page }) => {
    await setAdminScenario({ users: "historiques" });
    await page.goto("/admin/user/Jean%20Pierre.Martin/reset");
    await expect(page.getByRole("heading", { level: 2, name: "Réinitialiser le mot de passe de Jean Pierre MARTIN ?" })).toBeVisible();
    await expect(page.getByText("Identifiant : Jean Pierre.Martin")).toBeVisible();
    await confirmButton(page, "Réinitialiser le mot de passe").click();
    await expect(notice(page, "Mot de passe réinitialisé.")).toBeVisible();
    expect(await getWrites()).toMatchObject([{ method: "PUT", path: "/api/users/Jean%20Pierre.Martin" }]);
  });

  test("la liste encode le lien, la suppression fonctionne de bout en bout", async ({ page }) => {
    await setAdminScenario({ users: "historiques" });
    await page.goto("/admin/user");
    await page.getByRole("link", { name: "Supprimer Jean Pierre MARTIN" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user/Jean%20Pierre.Martin/delete`);
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(notice(page, "Compte supprimé.")).toBeVisible();
    await expect(page.getByRole("row", { name: /Jean Pierre/ })).toHaveCount(0);
    expect(await getWrites()).toMatchObject([{ method: "DELETE", path: "/api/users/Jean%20Pierre.Martin" }]);
  });
});

test.describe("Revalidation (C3)", () => {
  test("supprimer un joueur retire son compte de la liste des utilisateurs", async ({ page }) => {
    await page.goto("/admin/user");
    await expect(page.getByRole("row", { name: /paul\.durand/ })).toBeVisible();
    await page.goto("/admin/player/LIC1001/delete");
    await confirmButton(page, "Supprimer définitivement").click();
    await expect(notice(page, "Joueur supprimé.")).toBeVisible();
    await page.getByRole("link", { name: "Utilisateurs" }).first().click();
    await expect(page).toHaveURL(`${APP_URL}/admin/user`);
    await expect(page.getByRole("row", { name: /compte\.sans\.joueur/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /paul\.durand/ })).toHaveCount(0);
  });
});

test.describe("Accessibilité", () => {
  test("parcours clavier de la liste à la création, soumission avec Entrée", async ({ page }) => {
    await page.goto("/admin/user");
    await page.getByRole("link", { name: "Nouveau compte" }).first().focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${APP_URL}/admin/user/create`);
    await usernameField(page).focus();
    await page.keyboard.type("clavier.test");
    await page.keyboard.press("Enter");
    await expect(notice(page, "Compte « clavier.test » créé.")).toBeVisible();
    await expect(page.getByRole("row", { name: /clavier\.test/ })).toBeVisible();
  });

  test("champ de 48 px, interface en français, champ obligatoire marqué, identifiants lus tels quels", async ({ page }) => {
    await page.goto("/admin/user/create");
    const box = await usernameField(page).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(usernameField(page)).toHaveAttribute("aria-required", "true");
    await expect(usernameField(page)).toHaveAttribute("maxlength", "64");
  });

  test("le sélecteur de joueur est une liste de liens de 48 px au moins", async ({ page }) => {
    await page.goto("/admin/user/create");
    const box = await page.getByRole("link", { name: "Hugo FAURE, FAC Basket" }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  });
});
