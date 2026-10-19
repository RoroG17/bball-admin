import { expect, test, type Page } from "@playwright/test";
import { APP_URL, getHits, getWrites, loginAs, setAdminScenario, type AdminScenario } from "./helpers";

/*
 * Matchs (spec § 8, critères corrigés par D-ADM-1 à D-ADM-5 et D-G1 / D-G3 / D-G5 / D-G6 / D-G8 / D-G12). Fixtures
 * reconstruites : `tests/fixtures/admin-game/`. Magasin du faux back : saison 4 (2025-2026 · D1 · U15G, équipe RPB FAC
 * Basket n° 1) = 18 matchs (36 à 53), le 47 = journée 9, OTB reçoit FAC Basket, 54-50, 10 lignes de stats ; le 41 = égalité
 * 70-70 ; le 48 = à saisir (aucune ligne de stats) ; le 49 = score à saisir (0-0 passé) ; 50 à 53 = à venir. Saison 1 = 14 matchs.
 */
const SCENARIO: AdminScenario = { adminGame: "ok" };
const rows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });
const appWrites = async () => (await getWrites()).filter((write) => write.authorization !== null);
const combo = (page: Page, name: string) => page.getByRole("combobox", { name, exact: true });
const roundField = (page: Page) => page.getByRole("spinbutton", { name: "Journée", exact: true });
const ack = (page: Page, name: string | RegExp) => page.getByRole("checkbox", { name });
const ACK_DUPLICATE = "Je confirme : c'est bien un second match pour cette journée";

async function fillCreate(page: Page, values: { round?: string; date?: string; side?: string; opponent?: string } = {}) {
  await roundField(page).fill(values.round ?? "19");
  await page.getByLabel("Date du match").fill(values.date ?? "2026-03-14");
  await combo(page, "Côté de l'équipe RPB").selectOption({ label: values.side ?? "Domicile" });
  await combo(page, "Équipe adverse").selectOption({ label: values.opponent ?? "OTB" });
}

test.beforeEach(async ({ context }) => {
  await setAdminScenario(SCENARIO);
  await loginAs(context, "admin");
});

test.describe("Accès (critères 1 et 2)", () => {
  for (const route of ["/admin/game", "/admin/game/create", "/admin/game/12/edit", "/admin/game/12/delete"]) {
    test(`joueur sur ${route} : « Accès refusé », aucune donnée lue ni écriture`, async ({ page, context }) => {
      await context.clearCookies();
      await loginAs(context, "player");
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1, name: "Accès refusé" })).toBeVisible();
      const hits = await getHits();
      expect([hits.adminReads, hits.matchs, hits.match]).toEqual([0, 0, 0]);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("une action appelée avec une session joueur ne produit aucune écriture", async ({ page, context }) => {
    await page.goto("/admin/game/create");
    await fillCreate(page);
    await context.clearCookies();
    await loginAs(context, "player");
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Action réservée aux administrateurs." })).toBeVisible();
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Liste (critères 3 à 6)", () => {
  test("saison la plus récente par défaut, URL canonique, tri date puis journée ; changer la saison met l'URL à jour", async ({ page }) => {
    await page.goto("/admin/game");
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    await expect(rows(page)).toHaveCount(18);
    await expect(rows(page).first()).toContainText("1");
    await expect(rows(page).nth(8)).toContainText("OTB");
    await page.goto("/admin/game?saison=999");
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);

    await combo(page, "Saison").selectOption({ label: "2024-2025 · D3 · U15G" });
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=1`);
    await expect(rows(page)).toHaveCount(14);
    await expect(page.getByRole("table")).toContainText("Matchs de la saison 2024-2025 · D3 · U15G");
  });

  test("contenu d'une ligne : journée, date française, équipes avec repère RPB en texte, score ou « À venir » / « Score à saisir »", async ({ page }) => {
    await page.goto("/admin/game?saison=4");
    const played = rows(page).filter({ hasText: "OTB" }).first();
    await expect(played).toContainText("OTB");
    await expect(played).toContainText("FAC Basket");
    await expect(played).toContainText("RPB");
    await expect(played).toContainText("54 – 50");
    await expect(played.getByText(/\d{1,2} \p{L}+ \d{4}/u)).toBeVisible();
    await expect(rows(page).filter({ hasText: "US Auterive" }).filter({ hasText: "Score à saisir" })).toHaveCount(1);
    await expect(rows(page).filter({ hasText: "Racing Portet Basket" }).filter({ hasText: "À venir" })).toHaveCount(1);
  });

  test("tri par journée dans l'URL et recherche d'équipe sans accents", async ({ page }) => {
    await page.goto("/admin/game?saison=4");
    await page.getByRole("columnheader", { name: /Journée/ }).getByRole("link").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4&tri=round`);
    await page.getByRole("searchbox", { name: "Rechercher une équipe" }).fill("labarthe sur leze");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(rows(page)).toHaveCount(2);
    await page.goto("/admin/game?saison=4&q=zzzz");
    await expect(page.getByText("Aucun match ne correspond à « zzzz »")).toBeVisible();
  });

  test("saison sans match : message dédié et « Créer un match » ; back en erreur : erreur de bloc avec « Réessayer »", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, matchs: "vide" });
    await page.goto("/admin/game?saison=4");
    await expect(page.getByText("Aucun match dans cette saison")).toBeVisible();
    await page.getByRole("link", { name: "Créer un match" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game/create?saison=4`);

    await setAdminScenario({ ...SCENARIO, matchs: "error" });
    await page.goto("/admin/game?saison=4");
    await expect(page.getByRole("alert").filter({ hasText: "Matchs de la saison" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await setAdminScenario(SCENARIO);
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(rows(page)).toHaveCount(18);
  });

  test("actions nommées avec le match ; « Saisir les stats » masqué ; « À saisir » pour un match de review", async ({ page }) => {
    await page.goto("/admin/game?saison=4");
    await expect(page.getByRole("link", { name: /^Voir le match de la journée 9, OTB contre FAC Basket/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Supprimer le match de la journée 9, OTB contre FAC Basket/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Saisir les stats/ })).toHaveCount(0);
    await expect(rows(page).filter({ hasText: "Saint-Girons BB" }).filter({ hasText: "À saisir" })).toHaveCount(1);
    await page.getByRole("link", { name: /^Modifier le match de la journée 9, OTB contre FAC Basket/ }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game/47/edit`);
  });

  test("review en erreur ou illisible : « Non vérifié », la liste reste affichée", async ({ page }) => {
    for (const matchsReview of ["error", "format-invalide"] as const) {
      await setAdminScenario({ ...SCENARIO, matchsReview });
      await page.goto("/admin/game?saison=4");
      await expect(rows(page)).toHaveCount(18);
      await expect(rows(page).first()).toContainText("Non vérifié");
      await expect(page.getByText("L'état des statistiques n'a pas pu être vérifié")).toBeVisible();
    }
  });
});

test.describe("Création (critères 7 à 12)", () => {
  test("envoi vide : une erreur sous chaque champ, zéro écriture", async ({ page }) => {
    await page.goto("/admin/game/create?saison=4");
    await expect(combo(page, "Saison")).toHaveValue("4");
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(roundField(page)).toHaveAccessibleDescription("Saisis le numéro de la journée.");
    await expect(page.getByLabel("Date du match")).toHaveAccessibleDescription("Saisis la date du match.");
    await expect(combo(page, "Côté de l'équipe RPB")).toHaveAccessibleDescription(/Choisis le côté/);
    await expect(combo(page, "Équipe adverse")).toHaveAccessibleDescription("Choisis l'équipe adverse.");
    expect(await appWrites()).toEqual([]);
  });

  test("l'équipe RPB de la saison n'est jamais proposée comme adversaire ; saison sans RPB : refus, zéro écriture", async ({ page }) => {
    await page.goto("/admin/game/create?saison=4");
    await expect(page.getByText("Équipe RPB de cette saison : FAC Basket")).toBeVisible();
    await expect(combo(page, "Équipe adverse").locator("option", { hasText: "FAC Basket" })).toHaveCount(0);
    await expect(combo(page, "Équipe adverse").locator("option", { hasText: "OTB" })).toHaveCount(1);

    await setAdminScenario({ ...SCENARIO, saisons: "sans-equipe" });
    await page.goto("/admin/game/create?saison=1");
    await expect(page.getByText("Cette saison n'a pas d'équipe RPB associée : elle ne permet pas de créer de match.")).toBeVisible();
    await fillCreate(page, { opponent: "OTB" });
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(combo(page, "Saison")).toHaveAccessibleDescription(/Cette saison n'a pas d'équipe RPB associée/);
    expect(await appWrites()).toEqual([]);
  });

  test("journée 0 refusée ; journée existante : case de confirmation, envoi bloqué puis accepté une fois cochée", async ({ page }) => {
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page, { round: "0" });
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(roundField(page)).toHaveAccessibleDescription(/entier compris entre 1 et 999/);
    expect(await appWrites()).toEqual([]);

    await roundField(page).fill("9");
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(ack(page, ACK_DUPLICATE)).toBeVisible();
    await expect(page.getByText("La journée 9 existe déjà dans cette saison.")).toBeVisible();
    await expect(roundField(page)).toHaveValue("9");
    expect(await appWrites()).toEqual([]);

    await ack(page, ACK_DUPLICATE).check();
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect((await appWrites()).filter((write) => write.method === "POST")).toHaveLength(1);
  });

  test("date hors saison : case de confirmation, zéro écriture avant la coche", async ({ page }) => {
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page, { date: "2030-01-01" });
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(page.getByText("Cette date n'est pas dans la saison 2025-2026.")).toBeVisible();
    expect(await appWrites()).toEqual([]);
    await ack(page, "Je confirme cette date").check();
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect(await appWrites()).toHaveLength(1);
  });

  test("succès : redirection vers la liste de la saison, message « créé » annoncé, URL nettoyée, payload sans score ni vidéo", async ({ page }) => {
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page, { side: "Domicile", opponent: "OTB" });
    await roundField(page).press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Match « Journée 19 : FAC Basket – OTB » créé." })).toBeVisible();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    await expect(rows(page)).toHaveCount(19);
    const [write, ...others] = await appWrites();
    expect(others).toEqual([]);
    expect(write).toMatchObject({ method: "POST", path: "/api/matchs" });
    expect(write.body).toEqual({ Id_Saison: 4, numero: 19, date_match: "2026-03-14", equipe_domicile: 1, equipe_exterieur: 14 });
  });

  test("côté extérieur : le RPB est l'équipe extérieure", async ({ page }) => {
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page, { side: "Extérieur", opponent: "OTB" });
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect((await appWrites())[0].body).toMatchObject({ equipe_domicile: 14, equipe_exterieur: 1 });
  });

  test("double clic « Créer » : une seule écriture", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, adminWrite: "slow" });
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page);
    await page.getByRole("button", { name: "Créer le match" }).dblclick();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect((await appWrites()).filter((write) => write.method === "POST")).toHaveLength(1);
  });

  test("422 et 404 du back : erreur en français sous le bon champ, saisie conservée, jamais la phrase du back", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, adminWrite: "422" });
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page);
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(page.getByLabel("Date du match")).toHaveAccessibleDescription("Ce champ est obligatoire.");
    await expect(page.getByText("The date match")).toHaveCount(0);
    await expect(roundField(page)).toHaveValue("19");

    await setAdminScenario({ ...SCENARIO, adminWrite: "404-team" });
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page);
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(combo(page, "Équipe adverse")).toHaveAccessibleDescription(/Cette équipe n'existe plus/);
    await expect(page.getByText("L'équipe n'existe pas")).toHaveCount(0);

    await setAdminScenario({ ...SCENARIO, adminWrite: "404-season" });
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page);
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(combo(page, "Saison")).toHaveAccessibleDescription(/Cette saison n'existe plus/);

    await setAdminScenario({ ...SCENARIO, adminWrite: "error" });
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page);
    await page.getByRole("button", { name: "Créer le match" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Le serveur a refusé l'opération" })).toBeVisible();
  });

  test("« Annuler » ramène à la liste de la saison d'origine sans écriture", async ({ page }) => {
    await page.goto("/admin/game/create?saison=1");
    await expect(combo(page, "Saison")).toHaveValue("1");
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=1`);
    expect(await appWrites()).toEqual([]);
  });
});

test.describe("Modification (critères 13 à 18)", () => {
  test("pré-rempli, listes synchronisées", async ({ page }) => {
    await page.goto("/admin/game/47/edit");
    await expect(combo(page, "Saison")).toHaveValue("4");
    await expect(combo(page, "Côté de l'équipe RPB")).toHaveValue("away");
    await expect(combo(page, "Équipe adverse")).toHaveValue("14");
    await expect(roundField(page)).toHaveValue("9");
    await expect(page.getByLabel("Score domicile")).toHaveValue("54");
    await expect(page.getByLabel("Score extérieur")).toHaveValue("50");
    await expect(page.getByText("Ce match a 10 lignes de statistiques.")).toBeVisible();
  });

  test("identifiant inconnu ou invalide : « Match introuvable » sans formulaire ; lecture en échec : page d'erreur sans formulaire", async ({ page }) => {
    for (const id of ["99999", "abc"]) {
      await page.goto(`/admin/game/${id}/edit`);
      await expect(page.getByRole("heading", { name: "Match introuvable" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Enregistrer les modifications" })).toHaveCount(0);
    }
    await setAdminScenario({ ...SCENARIO, matchsStats: "erreur" });
    await page.goto("/admin/game/47/edit");
    await expect(page.getByRole("button", { name: "Enregistrer les modifications" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
  });

  test("scores : un seul rempli ou négatif refusés ; les deux vides = match non joué (payload 0/0)", async ({ page }) => {
    await page.goto("/admin/game/47/edit");
    await page.getByLabel("Score extérieur").fill("");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByLabel("Score extérieur")).toHaveAccessibleDescription(/Saisis aussi l'autre score/);
    await page.getByLabel("Score extérieur").fill("-3");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByLabel("Score extérieur")).toHaveAccessibleDescription(/entier positif ou nul/);
    expect(await appWrites()).toEqual([]);

    await page.getByLabel("Score domicile").fill("");
    await page.getByLabel("Score extérieur").fill("");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    const writes = await appWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "PUT", path: "/api/matchs/47" });
    expect(writes[0].body).toMatchObject({ score_domicile: 0, score_exterieur: 0, video: null });
  });

  test("égalité : case de confirmation, zéro écriture avant la coche", async ({ page }) => {
    await page.goto("/admin/game/47/edit");
    await page.getByLabel("Score domicile").fill("60");
    await page.getByLabel("Score extérieur").fill("60");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText(/Les deux équipes ont le même score \(60\)/)).toBeVisible();
    expect(await appWrites()).toEqual([]);
    await ack(page, "Je confirme cette égalité").check();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect(await appWrites()).toHaveLength(1);
  });

  test("vidéo : URL complète acceptée et envoyée comme identifiant, retour en direct, texte invalide signalé avant envoi, retrait refusé", async ({ page }) => {
    await page.goto("/admin/game/47/edit");
    const video = page.getByLabel("Vidéo YouTube");
    await video.fill("pas une vidéo");
    await expect(page.getByText("Lien vidéo non reconnu. Saisis l'identifiant YouTube")).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(video).toHaveAccessibleDescription(/Lien vidéo non reconnu/);
    expect(await appWrites()).toEqual([]);

    await video.fill("https://www.youtube.com/watch?v=abcdefghijk");
    await expect(page.getByText("Vidéo reconnue (identifiant abcdefghijk).")).toBeVisible();
    await expect(page.getByRole("link", { name: /Vérifier sur YouTube/ })).toHaveAttribute("href", "https://www.youtube.com/watch?v=abcdefghijk");
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect((await appWrites())[0].body).toMatchObject({ video: "abcdefghijk" });

    await page.goto("/admin/game/47/edit");
    await expect(video).toHaveValue("abcdefghijk");
    await video.fill("");
    await expect(page.getByText(/Le serveur ne permet pas encore de retirer une vidéo/)).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(video).toHaveAccessibleDescription(/ne permet pas encore de retirer une vidéo/);
    expect(await appWrites()).toHaveLength(1);
  });

  test("changement d'équipe avec stats : case mentionnant le nombre de lignes, zéro écriture avant la coche", async ({ page }) => {
    await page.goto("/admin/game/47/edit");
    await combo(page, "Équipe adverse").selectOption({ label: "JS Cugnaux" });
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText(/Ce match a 10 lignes de statistiques\. Changer la saison ou les équipes/)).toBeVisible();
    expect(await appWrites()).toEqual([]);
    await ack(page, "Je confirme le déplacement des statistiques").check();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect((await appWrites())[0].body).toMatchObject({ equipe_domicile: 7, equipe_exterieur: 1 });
  });

  test("changement de saison avec stats : avertissement de déplacement, puis enregistrement dans la liste de la nouvelle saison", async ({ page }) => {
    await page.goto("/admin/game/47/edit");
    await combo(page, "Saison").selectOption({ label: "2024-2025 · D3 · U15G" });
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText(/Ce match a 10 lignes de statistiques/)).toBeVisible();
    expect(await appWrites()).toEqual([]);
    await expect(page.getByRole("checkbox")).toHaveCount(3);
    for (const box of await page.getByRole("checkbox").all()) await box.check();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=1`);
    expect((await appWrites())[0].body).toMatchObject({ Id_Saison: 1 });
  });

  test("match sans stats : changer d'équipe n'avertit pas ; « Annuler » ramène à la liste de la saison du match", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, matchsStats: "sans" });
    await page.goto("/admin/game/47/edit");
    await expect(page.getByText(/lignes? de statistiques\./)).toHaveCount(0);
    await combo(page, "Équipe adverse").selectOption({ label: "JS Cugnaux" });
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    await page.goto("/admin/game/47/edit");
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect(await appWrites()).toHaveLength(1);
  });

  test("match hérité sans l'équipe RPB de sa saison : équipes en lecture seule, score modifiable", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, saisons: "sans-equipe" });
    await page.goto("/admin/game/1/edit");
    await expect(page.getByText("Ce match n'oppose pas l'équipe RPB de la saison")).toBeVisible();
    await expect(combo(page, "Équipe adverse")).toHaveCount(0);
    await page.getByLabel("Score domicile").fill("40");
    await page.getByLabel("Score extérieur").fill("41");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=1`);
    expect((await appWrites())[0].body).toMatchObject({ equipe_domicile: 2, equipe_exterieur: 1, score_domicile: 40, score_exterieur: 41 });
  });

  test("match disparu entre-temps (404) : message, aucune fausse réussite", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, adminWrite: "404" });
    await page.goto("/admin/game/47/edit");
    await page.getByLabel("Score domicile").fill("55");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText(/n'existe plus|Match introuvable/).first()).toBeVisible();
    await expect(page).not.toHaveURL(/notice=updated/);
  });
});

test.describe("Suppression (critères 19 à 21, D-ADM-1 : jamais de blocage)", () => {
  test("confirmation : match nommé, impact chiffré, « Annuler » sans écriture", async ({ page }) => {
    await page.goto("/admin/game/47/delete");
    await expect(page.getByRole("heading", { name: "Supprimer ce match ?" })).toBeVisible();
    await expect(page.getByText(/Journée 9 · OTB contre FAC Basket · /)).toBeVisible();
    await expect(page.getByText("10 lignes de statistiques de match (tirs compris)")).toBeVisible();
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect(await appWrites()).toEqual([]);
  });

  test("match avec stats : jamais bloqué ; succès → liste sans la ligne et message", async ({ page }) => {
    await page.goto("/admin/game/47/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    await expect(page.getByRole("status").filter({ hasText: "Match supprimé." })).toBeVisible();
    await expect(rows(page)).toHaveCount(17);
    await expect(page.getByRole("link", { name: /Modifier le match de la journée 9, OTB/ })).toHaveCount(0);
    const writes = await appWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "DELETE", path: "/api/matchs/47" });
  });

  test("500 : message de suppression échouée, la ligne reste ; 404 : le match n'existe plus", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, adminWrite: "error" });
    await page.goto("/admin/game/47/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "La suppression a échoué" })).toBeVisible();
    await page.goto("/admin/game?saison=4");
    await expect(rows(page)).toHaveCount(18);

    await setAdminScenario({ ...SCENARIO, adminWrite: "404" });
    await page.goto("/admin/game/47/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText(/n'existe plus|Match introuvable/).first()).toBeVisible();
    await page.goto("/admin/game?saison=4");
    await expect(rows(page)).toHaveCount(17);
  });

  test("impact illisible : lecture en erreur → bouton absent et « Réessayer » ; nombre indéterminé → bouton présent avec la mention", async ({ page }) => {
    await setAdminScenario({ ...SCENARIO, matchsStats: "erreur" });
    await page.goto("/admin/game/47/delete");
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();

    await setAdminScenario({ ...SCENARIO, matchsStats: "inconnu" });
    await page.goto("/admin/game/47/delete");
    await expect(page.getByText("un nombre indéterminé de lignes de statistiques de match (tirs compris)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toBeVisible();
  });

  test("identifiant invalide ou inconnu : « Match introuvable »", async ({ page }) => {
    for (const id of ["abc", "99999"]) {
      await page.goto(`/admin/game/${id}/delete`);
      await expect(page.getByRole("heading", { name: "Match introuvable" })).toBeVisible();
    }
  });
});

test.describe("Accessibilité et revalidation (critères 22 et 23)", () => {
  test("parcours clavier : liste → création → champs → soumission par Entrée ; Échap n'a rien à fermer", async ({ page }) => {
    await page.goto("/admin/game?saison=4");
    await page.getByRole("link", { name: "Nouveau match" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${APP_URL}/admin/game/create?saison=4`);
    await combo(page, "Saison").focus();
    await page.keyboard.press("Tab");
    await expect(combo(page, "Côté de l'équipe RPB")).toBeFocused();
    await page.keyboard.press("Escape");
    await combo(page, "Côté de l'équipe RPB").selectOption({ label: "Extérieur" });
    await combo(page, "Équipe adverse").selectOption({ label: "OTB" });
    await roundField(page).fill("20");
    await page.getByLabel("Date du match").fill("2026-03-21");
    await roundField(page).press("Enter");
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    expect(await appWrites()).toHaveLength(1);
  });

  test("cases d'acquittement d'au moins 48 px de haut", async ({ page }) => {
    await page.goto("/admin/game/create?saison=4");
    await fillCreate(page, { round: "9" });
    await page.getByRole("button", { name: "Créer le match" }).click();
    const box = await page.getByText(ACK_DUPLICATE).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    const label = page.locator("label", { hasText: ACK_DUPLICATE });
    expect((await label.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
  });

  test("après un PUT, la fiche du match (déjà visitée) reflète le score", async ({ page }) => {
    await page.goto("/game/49");
    await expect(page.getByText("Score à saisir").first()).toBeVisible();
    await page.goto("/admin/game/49/edit");
    await page.getByLabel("Score domicile").fill("61");
    await page.getByLabel("Score extérieur").fill("48");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game?saison=4`);
    await page.getByRole("link", { name: /^Voir le match de la journée 14/ }).click();
    await expect(page).toHaveURL(`${APP_URL}/game/49`);
    await expect(page.getByText("61").first()).toBeVisible();
    await expect(page.getByText("Score à saisir")).toHaveCount(0);
  });

  test("la fiche du match mène à l'édition (AdminGameActions)", async ({ page }) => {
    await page.goto("/game/47");
    await page.getByRole("link", { name: "Modifier le match" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/game/47/edit`);
  });
});
