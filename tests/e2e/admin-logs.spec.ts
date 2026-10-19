import { expect, test, type Page } from "@playwright/test";
import { APP_URL_BACK_DELIVERED, getLogQueries, loginAs, setAdminScenario } from "./helpers";

/*
 * Journaux (spec § 8, critères corrigés par D-ADM-1 à D-ADM-5). Les critères « suppression » (D-ADM-4) et « appel direct
 * sans jeton → 401/403 » (D-ADM-5, relève du back) ne s'appliquent pas. Jeu reconstruit : 134 erreurs, 120 requêtes
 * (`tests/fixtures/admin-logs/`). Première ligne des erreurs : n° 1900, 500 « Server Error », theo.bernard ; n° 1899 :
 * source client avec contexte ; n° 1898 : anonyme.
 *
 * Deux serveurs : le principal reproduit le back du 12/10/2026 (onglet Erreurs, filtres plateforme / système / source) ;
 * le second (port 3101, NODE_ENV=test, LOG_BACK_SUPPORT_OVERRIDE=all) simule le « back livré » (B-LOG-1 à B-LOG-4).
 */
const rows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });
const detailLink = (page: Page, text: string) => page.getByRole("link", { name: new RegExp(`^Détail ${text}`) });

// La première compilation à froid de /admin/logs (serveur de développement) peut dépasser les 60 s par défaut.
test.setTimeout(120_000);

test.beforeEach(async ({ context }) => {
  await setAdminScenario();
  await loginAs(context, "admin");
});

test.describe("Accès", () => {
  test("visiteur : retour à la connexion avec la page demandée, aucune lecture", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/admin/logs?type=erreurs");
    await expect(page).toHaveURL(/\/login\?redirect=/);
    expect(await getLogQueries()).toEqual([]);
  });

  test("joueur : « Accès refusé », navigation admin absente, aucun appel à /api/logs, aucun message de log dans le HTML", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAs(context, "player");
    const response = await page.goto("/admin/logs");
    await expect(page.getByRole("heading", { level: 1, name: "Accès refusé" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Administration" })).toHaveCount(0);
    expect(await getLogQueries()).toEqual([]);
    const html = (await response?.text()) ?? "";
    expect(html).not.toContain("Server Error");
    expect(html).not.toContain("theo.bernard");
  });
});

test.describe("Liste des erreurs", () => {
  test("50 lignes par page, plus récentes d'abord, colonnes, « Anonyme », 134 erreurs", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(page.getByRole("heading", { level: 1, name: "Journaux" })).toBeVisible();
    await expect(rows(page)).toHaveCount(50);
    for (const name of ["Date", "Source", "Statut", "Message", "Route", "Utilisateur", "Plateforme"]) {
      await expect(page.getByRole("columnheader", { name })).toBeVisible();
    }
    await expect(page.getByText(/134 erreurs/).first()).toBeVisible();
    await expect(page.getByText("Erreurs, de la plus récente à la plus ancienne")).toBeVisible();
    const dates = await page.getByRole("table").locator("time").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("datetime") ?? ""));
    expect(dates).toHaveLength(50);
    expect([...dates].sort().reverse()).toEqual(dates);
    await expect(rows(page).nth(0)).toContainText("500");
    await expect(rows(page).nth(0)).toContainText("theo.bernard");
    await expect(rows(page).nth(2)).toContainText("Anonyme");
    // Heure de Paris : 12:02:11 UTC → 14:02:11.
    await expect(rows(page).nth(0)).toContainText("12/10/2026");
    await expect(rows(page).nth(0)).toContainText("14:02:11");
  });

  test("statut et source lisibles sans la couleur : code, libellé de classe et texte", async ({ page }) => {
    await page.goto("/admin/logs");
    const first = rows(page).nth(0);
    await expect(first).toContainText("500");
    await expect(first).toContainText("Erreur serveur");
    await expect(first).toContainText("Serveur");
    await expect(first.locator("svg").first()).toBeVisible();
    await expect(rows(page).nth(1)).toContainText("Client");
    await expect(rows(page).nth(1)).toContainText("Sans statut HTTP");
  });

  test("lecture seule : aucun bouton ni lien de suppression ou de purge, aucune case à cocher", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(rows(page)).toHaveCount(50);
    await expect(page.getByRole("button", { name: /supprim|purg|vider|effacer/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /supprim|purg|vider|effacer/i })).toHaveCount(0);
    await expect(page.getByRole("checkbox")).toHaveCount(0);
  });

  test("bandeaux permanents : rétention de 7 jours et couverture (IP du serveur, pages du cache)", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(page.getByText("Les journaux sont conservés 7 jours, puis supprimés automatiquement.")).toBeVisible();
    await expect(page.getByText(/pages servies depuis le cache de l'application/)).toBeVisible();
    await expect(page.getByText(/l'adresse IP est celle du serveur de l'application/)).toBeVisible();
  });

  test("seul l'onglet Erreurs existe (D-L1) et les filtres supportés sont les seuls proposés (D-L2)", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(page.getByRole("navigation", { name: "Type de journal" })).toHaveCount(0);
    await expect(page.getByLabel("Plateforme")).toBeVisible();
    await expect(page.getByLabel("Système (contient)")).toBeVisible();
    await expect(page.getByLabel("Source")).toBeVisible();
    for (const label of ["Nom d'utilisateur", "Route (contient)", "Statut", "Du", "Au"]) {
      await expect(page.getByLabel(label, { exact: true })).toHaveCount(0);
    }
    // Un ancien lien vers un filtre ou un onglet non supportés est redressé.
    await page.goto("/admin/logs?type=requetes&du=2026-10-12&statut=5xx&utilisateur=lucas");
    await expect(page).toHaveURL(/\/admin\/logs$/);
  });

  test("la V2 n'envoie aucun en-tête X-Client-*, ni X-Forwarded-For, ni coordonnée", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(rows(page)).toHaveCount(50);
    const queries = await getLogQueries();
    expect(queries.length).toBeGreaterThan(0);
    for (const query of queries) {
      expect(Object.keys(query.headers).filter((name) => name.startsWith("x-"))).toEqual([]);
      expect(Object.keys(query.query).filter((name) => /lat|lon|gps/.test(name) && name !== "platform")).toEqual([]);
      expect(query.query.per_page).toBe("50");
    }
  });

  test("pas de cache Next : deux chargements successifs = deux appels", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(rows(page)).toHaveCount(50);
    const before = (await getLogQueries()).length;
    await page.goto("/admin/logs");
    await expect(rows(page)).toHaveCount(50);
    expect((await getLogQueries()).length).toBe(before + 1);
  });

  test("un seul appel back par rendu, même avec le détail ouvert", async ({ page }) => {
    await page.goto("/admin/logs?detail=1900");
    await expect(page.getByRole("heading", { level: 2, name: "Détail de l'erreur n° 1900" })).toBeVisible();
    expect(await getLogQueries()).toHaveLength(1);
  });

  test("taille de page non forçable : ?per_page=100000 est redirigé et le back reçoit per_page=50", async ({ page }) => {
    await page.goto("/admin/logs?per_page=100000");
    await expect(page).toHaveURL(/\/admin\/logs$/);
    await expect(rows(page)).toHaveCount(50);
    const queries = await getLogQueries();
    expect(queries.map((query) => query.query.per_page)).toEqual(["50"]);
  });

  test("tablette paysage (1180 × 820) : pas de défilement horizontal de la page, tableau défilant et focalisable", async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto("/admin/logs");
    await expect(rows(page)).toHaveCount(50);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const region = page.getByRole("region", { name: "Erreurs, de la plus récente à la plus ancienne" });
    await expect(region).toHaveAttribute("tabindex", "0");
  });

  test("sous 1120 px de tableau : Utilisateur et Plateforme masquées (visibles dans le détail)", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/logs?detail=1900");
    await expect(rows(page)).toHaveCount(50);
    await expect(page.getByRole("columnheader", { name: "Utilisateur" })).toBeHidden();
    await expect(page.getByRole("columnheader", { name: "Plateforme" })).toBeHidden();
    await expect(page.getByRole("heading", { level: 2, name: /Détail de l'erreur/ })).toBeVisible();
    await expect(page.locator("#detail")).toContainText("theo.bernard");
  });
});

test.describe("États", () => {
  test("chargement : squelette visible pendant une lecture lente, puis la liste", async ({ page }) => {
    await setAdminScenario({ logs: "slow" });
    await page.goto("/admin/logs", { waitUntil: "commit" });
    await expect(page.getByText("Chargement…").first()).toBeAttached();
    await expect(rows(page)).toHaveCount(50);
  });

  test("vide : rappel de la rétention de 7 jours et action « Actualiser »", async ({ page }) => {
    await setAdminScenario({ logs: "empty" });
    await page.goto("/admin/logs");
    await expect(page.getByText("Aucune erreur enregistrée")).toBeVisible();
    await expect(page.getByText(/conservés 7 jours/).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "Actualiser" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("aucun résultat pour un filtre : « Réinitialiser les filtres » revient à la liste", async ({ page }) => {
    await setAdminScenario({ logs: "empty" });
    await page.goto("/admin/logs?source=client");
    await expect(page.getByText("Aucune entrée ne correspond à ces filtres")).toBeVisible();
    await page.getByRole("link", { name: "Réinitialiser les filtres" }).click();
    await expect(page).toHaveURL(/\/admin\/logs$/);
  });

  test("erreur : message et « Réessayer » (pas de spinner infini), le clic relit", async ({ page }) => {
    await setAdminScenario({ logs: "error" });
    await page.goto("/admin/logs");
    const alert = page.getByRole("alert").filter({ hasText: "Liste des erreurs" });
    await expect(alert).toBeVisible();
    await expect(page.getByText("Les journaux sont conservés 7 jours").first()).toBeVisible();
    const before = (await getLogQueries()).length;
    await alert.getByRole("button", { name: "Réessayer" }).click();
    await expect.poll(async () => (await getLogQueries()).length).toBeGreaterThan(before);
    await expect(alert).toBeVisible();
  });

  test("format invalide : le bloc est en erreur, jamais une liste partielle", async ({ page }) => {
    await setAdminScenario({ logs: "invalid" });
    await page.goto("/admin/logs");
    await expect(page.getByRole("alert").filter({ hasText: "Liste des erreurs" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("page hors plage : « Cette page n'existe plus » et lien vers la dernière page", async ({ page }) => {
    await page.goto("/admin/logs?page=999");
    await expect(page.getByText("Cette page n'existe plus")).toBeVisible();
    await page.getByRole("link", { name: "Aller à la dernière page" }).click();
    await expect(page).toHaveURL(/page=3/);
    await expect(rows(page)).toHaveCount(34);
  });
});

test.describe("Détail", () => {
  test("erreur serveur : URL ?detail=<id>#detail, message, date Paris et UTC, méthode, position absente", async ({ page }) => {
    await page.goto("/admin/logs");
    await detailLink(page, "l'erreur du 12/10/2026 14:02:11").click();
    await expect(page).toHaveURL(/\/admin\/logs\?detail=1900#detail$/);
    const detail = page.locator("#detail");
    await expect(detail.getByRole("heading", { level: 2, name: "Détail de l'erreur n° 1900" })).toBeVisible();
    await expect(detail).toContainText("Server Error");
    await expect(detail).toContainText("UTC : 12/10/2026 12:02:11");
    await expect(detail).toContainText("Méthode");
    await expect(detail).toContainText("Aucun contexte");
    await expect(detail).toContainText("Non renseignée");
    // La ligne ouverte est signalée en texte et par aria-current.
    const open = page.getByRole("link", { name: /\(ouvert\)$/ });
    await expect(open).toHaveAttribute("aria-current", "true");
    await expect(open).toContainText("Ouvert");
  });

  test("erreur client : contexte JSON complet, méthode absente", async ({ page }) => {
    await page.goto("/admin/logs?detail=1899");
    const detail = page.locator("#detail");
    await expect(detail.getByRole("heading", { level: 2, name: "Détail de l'erreur n° 1899" })).toBeVisible();
    await expect(detail.getByLabel("Contexte (JSON)")).toContainText('"retries": 2');
    await expect(detail).not.toContainText("Méthode");
    await expect(detail).toContainText("Network request failed");
  });

  test("utilisateur anonyme : mention explicite dans le détail", async ({ page }) => {
    await page.goto("/admin/logs?detail=1898");
    await expect(page.locator("#detail")).toContainText("Aucun utilisateur identifié, ou compte supprimé");
  });

  test("détail introuvable : message dans le panneau, pas d'erreur de page", async ({ page }) => {
    await page.goto("/admin/logs?detail=424242");
    await expect(page.locator("#detail")).toContainText("Cette entrée n'est plus sur cette page");
    await expect(rows(page)).toHaveCount(50);
  });

  test("« Fermer le détail » retire le panneau, la liste reste", async ({ page }) => {
    await page.goto("/admin/logs?detail=1900");
    await page.getByRole("link", { name: "Fermer le détail" }).click();
    await expect(page).toHaveURL(/\/admin\/logs$/);
    await expect(page.locator("#detail")).toHaveCount(0);
    await expect(rows(page)).toHaveCount(50);
  });

  test("position GPS affichée dans le détail seulement", async ({ page }) => {
    await page.goto("/admin/logs?detail=1895");
    await expect(page.locator("#detail")).toContainText("43,60452 ; 1,44338");
    await expect(page.getByRole("table")).not.toContainText("43,60452");
  });
});

test.describe("Texte brut (contenu non fiable)", () => {
  test("<script>, <a href> et U+202E s'affichent en texte : rien n'est interprété, aucune alerte", async ({ page }) => {
    await setAdminScenario({ logs: "hostile" });
    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.message());
      void dialog.dismiss();
    });
    await page.goto("/admin/logs");
    const table = page.getByRole("table");
    await expect(table).toContainText("<script>alert(1)</script>");
    await expect(table).toContainText('<a href="https://exemple.invalid/mise-a-jour">');
    await expect(table).toContainText("�");
    await expect(table.locator("script")).toHaveCount(0);
    await expect(table.locator("a[href*='exemple.invalid']")).toHaveCount(0);
    await expect(table.locator("img")).toHaveCount(0);
    await expect(table).toContainText("<img src=x onerror=alert(1)>");
    await expect(table.getByRole("cell").filter({ hasText: "txet inversé" }).first()).not.toContainText("‮");
    expect(dialogs).toEqual([]);
  });

  test("détail hostile : message de 30 000 caractères tronqué avec mention, contexte en texte", async ({ page }) => {
    await setAdminScenario({ logs: "hostile" });
    await page.goto("/admin/logs?detail=9002");
    const detail = page.locator("#detail");
    await expect(detail).toContainText("Texte tronqué : 20");
    await expect(detail).not.toContainText("FIN-DU-MESSAGE");
    await expect(detail.getByLabel("Contexte (JSON)")).toContainText('"c": 1');
    await page.goto("/admin/logs?detail=9001");
    await expect(page.locator("#detail script")).toHaveCount(0);
    await expect(page.locator("#detail")).toContainText("<script>alert(2)</script>");
  });

  test("retours à la ligne conservés dans le détail, aplatis en liste", async ({ page }) => {
    await setAdminScenario({ logs: "hostile" });
    await page.goto("/admin/logs?detail=9003");
    await expect(page.locator("#detail")).toContainText("Erreur\navec\tretours à la ligne");
    await expect(page.getByRole("table")).toContainText("Erreur avec retours à la ligne");
  });
});

test.describe("Filtres et pagination", () => {
  test("filtrer par plateforme : URL canonique, valeurs conservées au rechargement, back filtré, page 1", async ({ page }) => {
    await page.goto("/admin/logs");
    await page.getByLabel("Plateforme").selectOption("mobile");
    await page.getByRole("button", { name: "Filtrer" }).click();
    await expect(page).toHaveURL(/\/admin\/logs\?plateforme=mobile$/);
    const queries = await getLogQueries();
    expect(queries[queries.length - 1].query.platform).toBe("mobile");
    await expect(rows(page).first()).toContainText("Mobile");
    await page.reload();
    await expect(page.getByLabel("Plateforme")).toHaveValue("mobile");
    await expect(page.getByRole("link", { name: "Réinitialiser" })).toBeVisible();
  });

  test("système (contient) insensible à la casse et source : combinés dans l'URL, dans l'ordre canonique", async ({ page }) => {
    await page.goto("/admin/logs");
    await page.getByLabel("Système (contient)").fill("android");
    await page.getByLabel("Source").selectOption("client");
    await page.getByRole("button", { name: "Filtrer" }).click();
    await expect(page).toHaveURL(/\/admin\/logs\?os=android&source=client$/);
    await expect(rows(page).first()).toContainText("Android 14");
    await expect(rows(page).first()).toContainText("Client");
    for (const query of (await getLogQueries()).slice(-1)) expect(query.query).toMatchObject({ os: "android", source: "client" });
  });

  test("filtres conservés en page 2 ; changer un filtre revient en page 1 ; « Précédent » cohérent", async ({ page }) => {
    await page.goto("/admin/logs?source=server");
    await expect(page.getByText(/Page 1 sur/)).toBeVisible();
    await page.getByRole("link", { name: "Suivant" }).click();
    await expect(page).toHaveURL(/\/admin\/logs\?source=server&page=2$/);
    await expect(page.getByText(/Page 2 sur/)).toBeVisible();
    await expect(page.getByLabel("Source")).toHaveValue("server");
    await page.getByLabel("Plateforme").selectOption("mobile");
    await page.getByRole("button", { name: "Filtrer" }).click();
    await expect(page).toHaveURL(/\/admin\/logs\?plateforme=mobile&source=server$/);
    await page.goBack();
    await expect(page).toHaveURL(/page=2/);
  });

  test("pagination : « Précédent » absent en page 1, « Suivant » absent en dernière page, masquée à une seule page", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(page.getByRole("link", { name: "Précédent" })).toHaveCount(0);
    await expect(page.getByText("Page 1 sur 3 (134 erreurs)")).toBeVisible();
    await page.goto("/admin/logs?page=3");
    await expect(page.getByRole("link", { name: "Suivant" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Précédent" })).toBeVisible();
    await page.goto("/admin/logs?plateforme=web&os=zzz");
    await expect(page.getByRole("navigation", { name: "Pagination" })).toHaveCount(0);
  });

  test("date invalide dans l'URL : pas de 500, redirection, aucune borne envoyée", async ({ page }) => {
    await page.goto("/admin/logs?du=2026-13-45&au=2026-02-30");
    await expect(page).toHaveURL(/\/admin\/logs$/);
    await expect(rows(page)).toHaveCount(50);
    for (const query of await getLogQueries()) expect(query.query).not.toHaveProperty("from");
  });

  test("formulaire vide soumis : les paramètres vides sont retirés de l'URL", async ({ page }) => {
    await page.goto("/admin/logs");
    await page.getByRole("button", { name: "Filtrer" }).click();
    await expect(page).toHaveURL(/\/admin\/logs$/);
  });
});

test.describe("Clavier", () => {
  test("filtre → « Filtrer » → ligne → « Détail » → « Page suivante », focus visible", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(rows(page)).toHaveCount(50);
    await page.getByLabel("Plateforme").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Source")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Filtrer" })).toBeFocused();
    await page.keyboard.press("Tab");
    // Région du tableau focalisable, puis le premier lien « Détail ».
    await expect(page.getByRole("region", { name: /Erreurs, de la plus récente/ })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(detailLink(page, "l'erreur du 12/10/2026 14:02:11")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/detail=1900#detail$/);
    await page.getByRole("link", { name: "Suivant" }).focus();
    await expect(page.getByRole("link", { name: "Suivant" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/page=2$/);
  });
});

test.describe("Back livré (second serveur, table de capacités forcée)", () => {
  test.use({ baseURL: APP_URL_BACK_DELIVERED });

  test.beforeEach(async () => {
    await setAdminScenario({ logsBack: "livre" });
  });

  test("onglet Requêtes visible, sélectionné par ?type=requetes ; changer d'onglet réinitialise filtres et page", async ({ page }) => {
    await page.goto("/admin/logs?plateforme=web&page=2");
    const tabs = page.getByRole("navigation", { name: "Type de journal" });
    await expect(tabs.getByRole("link", { name: "Erreurs" })).toHaveAttribute("aria-current", "page");
    await tabs.getByRole("link", { name: "Requêtes" }).click();
    await expect(page).toHaveURL(/\/admin\/logs\?type=requetes$/);
    await expect(tabs.getByRole("link", { name: "Requêtes" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Requêtes, de la plus récente à la plus ancienne")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Durée" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Méthode" })).toBeVisible();
    await expect(page.getByLabel("Source")).toHaveCount(0);
  });

  test("requêtes : ni IP ni position en liste ; l'IP, sa note et la durée sont dans le détail", async ({ page }) => {
    await page.goto("/admin/logs?type=requetes");
    await expect(rows(page)).toHaveCount(50);
    await expect(page.getByRole("table")).not.toContainText("203.0.113.17");
    await expect(rows(page).first()).toContainText("120 ms");
    await detailLink(page, "la requête du 12/10/2026 14:02:11").click();
    const detail = page.locator("#detail");
    await expect(detail.getByRole("heading", { level: 2, name: "Détail de la requête n° 5200" })).toBeVisible();
    await expect(detail).toContainText("Adresse vue par l'API");
    await expect(detail).toContainText("203.0.113.17");
    await expect(detail).toContainText("l'adresse du serveur de l'application, pas celle du joueur");
    await expect(detail).toContainText("Mesurée jusqu'à l'envoi de la réponse");
  });

  test("« du 12/10 au 12/10 » (heure d'été) : le back reçoit 00:00:00 → 23:59:59 de Paris en UTC", async ({ page }) => {
    await page.goto("/admin/logs?du=2026-10-12&au=2026-10-12");
    await expect(page.getByLabel("Du", { exact: true })).toHaveValue("2026-10-12");
    const last = (await getLogQueries()).at(-1);
    expect(last?.query).toMatchObject({ from: "2026-10-11T22:00:00Z", to: "2026-10-12T21:59:59Z" });
    await expect(rows(page).first()).toContainText("12/10/2026");
  });

  test("« du 15/01 au 15/01 » (heure d'hiver)", async ({ page }) => {
    await page.goto("/admin/logs?du=2026-01-15&au=2026-01-15");
    const last = (await getLogQueries()).at(-1);
    expect(last?.query).toMatchObject({ from: "2026-01-14T23:00:00Z", to: "2026-01-15T22:59:59Z" });
    await expect(page.getByText("Aucune entrée ne correspond à ces filtres")).toBeVisible();
  });

  test("période saisie dans le formulaire : champs datés, URL canonique, période inversée redressée", async ({ page }) => {
    await page.goto("/admin/logs");
    await page.getByLabel("Du", { exact: true }).fill("2026-10-12");
    await page.getByLabel("Au", { exact: true }).fill("2026-10-10");
    await page.getByRole("button", { name: "Filtrer" }).click();
    await expect(page).toHaveURL(/du=2026-10-10&au=2026-10-12$/);
  });

  test("filtre utilisateur : le champ envoie `username=<nom>`, jamais un identifiant", async ({ page }) => {
    await page.goto("/admin/logs");
    await page.getByLabel("Nom d'utilisateur").fill("theo.bernard");
    await page.getByRole("button", { name: "Filtrer" }).click();
    await expect(page).toHaveURL(/utilisateur=theo\.bernard$/);
    const last = (await getLogQueries()).at(-1);
    expect(last?.query.username).toBe("theo.bernard");
    expect(last?.query).not.toHaveProperty("user_id");
    await expect(rows(page).first()).toContainText("theo.bernard");
    await expect(rows(page).filter({ hasText: "Anonyme" })).toHaveCount(0);
  });

  test("filtre statut par classe : 5xx → status_min=500 & status_max=599", async ({ page }) => {
    await page.goto("/admin/logs");
    await page.getByLabel("Statut", { exact: true }).selectOption("5xx");
    await page.getByRole("button", { name: "Filtrer" }).click();
    await expect(page).toHaveURL(/statut=5xx$/);
    const last = (await getLogQueries()).at(-1);
    expect(last?.query).toMatchObject({ status_min: "500", status_max: "599" });
    await expect(rows(page).first()).toContainText("Erreur serveur");
  });

  test("route (contient) et date invalide : redirection sans `from`", async ({ page }) => {
    await page.goto("/admin/logs?du=2026-13-45&route=%2Fapi%2Fmatchs");
    await expect(page).toHaveURL(/\/admin\/logs\?route=%2Fapi%2Fmatchs$/);
    const queries = await getLogQueries();
    expect(queries.every((query) => !("from" in query.query))).toBe(true);
    expect(queries.at(-1)?.query.route).toBe("/api/matchs");
  });

  test("toujours aucun en-tête X-Client-* ni GPS avec le back livré", async ({ page }) => {
    await page.goto("/admin/logs?type=requetes&utilisateur=lucas.marchand&statut=2xx");
    await expect(rows(page).first()).toBeVisible();
    for (const query of await getLogQueries()) {
      expect(Object.keys(query.headers).filter((name) => name.startsWith("x-"))).toEqual([]);
    }
  });
});
