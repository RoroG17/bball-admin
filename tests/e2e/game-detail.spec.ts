import { expect, test, type Page } from "@playwright/test";
import { APP_URL, getHits, loginAs, setGameDetailScenario } from "./helpers";

/*
 * Fixtures `tests/fixtures/game-detail/` : match réel n° 47 (journée 9, saison 4) anonymisé.
 * OTB (domicile) 54 – 49 FAC Basket (RPB, extérieur). 10 lignes de stats ; LIC1000 = Lucas MARTIN.
 * `joue-tirs` : 28 tirs placés (10 réussis) pour 53 tirs à 2 et 3 pts tentés.
 */
const GAME_URL = "/game/47";
const HEADING = "Journée 9 : OTB – FAC Basket";

const sheet = (page: Page) => page.getByRole("region", { name: "Feuille de stats" });
const statsTable = (page: Page) => sheet(page).getByRole("table");
const totalRow = (page: Page) => page.getByRole("row", { name: /Total équipe/ });
const shotChart = (page: Page) => page.getByRole("region", { name: "Carte des tirs" });
const adminAlerts = (page: Page) => page.getByRole("region", { name: "Alertes administrateur" });
const adminActions = (page: Page) => page.getByRole("navigation", { name: "Actions administrateur" });

test.beforeEach(async () => {
  await setGameDetailScenario("joue-tirs");
});

test.describe("Affiche", () => {
  test("journée, date, équipes, score, résultat et lieu en texte", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByRole("heading", { level: 1, name: HEADING })).toBeVisible();
    await expect(page.getByText("Saison 2025-2026 · D1 · U15G")).toBeVisible();
    await expect(page.getByText("Samedi 24 janvier 2026", { exact: true })).toBeVisible();
    await expect(page.getByText("FAC Basket contre OTB, journée 9, samedi 24 janvier 2026, défaite 49 à 54")).toBeAttached();
    await expect(page.getByText("Score final")).toBeVisible();
    await expect(page.getByText("Défaite", { exact: true })).toBeVisible();
    await expect(page.getByText("À l'extérieur")).toBeVisible();
  });

  test("« Retour au calendrier » revient sur la saison du match", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await page.getByRole("link", { name: "Retour au calendrier" }).click();
    await expect(page).toHaveURL(/\/game\?saison=4$/);
  });

  test("un clic depuis le calendrier ouvre la fiche", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await page.getByRole("link", { name: /journée 1,/ }).click();
    await expect(page).toHaveURL(/\/game\/36$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Feuille de stats", () => {
  test("chaque joueur, toutes les colonnes et la ligne Total équipe", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(statsTable(page)).toHaveAccessibleName("Statistiques par joueur, match complet");
    await expect(statsTable(page).getByRole("rowheader")).toHaveCount(11);
    for (const header of [
      "Joueur",
      "Minutes jouées (total du match)",
      "Points",
      "Rebonds",
      "Passes décisives",
      "Interceptions",
      "Contres",
      "Ballons perdus",
      "Fautes",
      "Tirs à 2 points (réussis / tentés)",
      "Tirs à 3 points (réussis / tentés)",
      "Lancers francs (réussis / tentés)",
    ]) {
      await expect(statsTable(page).getByRole("columnheader", { name: header, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("row", { name: /Lucas MARTIN/ })).toContainText("16:08");
    await expect(totalRow(page)).toContainText("49");
    await expect(totalRow(page)).toContainText("21/53");
  });

  test("filtre Q3 : valeurs recalculées, URL, Minutes masquée ; conservé au rechargement", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await page.getByRole("button", { name: "Quart-temps 3" }).click();
    await expect(page).toHaveURL(/\?periode=q3$/);
    await expect(page.getByRole("button", { name: "Quart-temps 3" })).toHaveAttribute("aria-pressed", "true");
    await expect(statsTable(page)).toHaveAccessibleName("Statistiques par joueur, quart-temps 3");
    await expect(statsTable(page).getByRole("columnheader", { name: /Minutes jouées/ })).toHaveCount(0);
    await expect(page.getByText("Minutes : total du match, visibles avec « Tout ».")).toBeVisible();
    await expect(totalRow(page).getByRole("cell").first()).toHaveText("13");
    await page.reload();
    await expect(page.getByRole("button", { name: "Quart-temps 3" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Tout" }).click();
    await expect(page).toHaveURL(new RegExp(`${GAME_URL}$`));
  });

  test("un clic sur un nom ouvre la fiche joueur", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByRole("link", { name: "Lucas MARTIN" })).toHaveAttribute("href", "/player/LIC1000");
  });

  test("minutes : « mm:ss », ancien entier et valeur absente", async ({ page, context }) => {
    await setGameDetailScenario("minutes");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByRole("row", { name: /Hugo BERNARD/ })).toContainText("24:13");
    await expect(page.getByRole("row", { name: /Nathan DUBOIS/ })).toContainText("32:00");
    await expect(page.getByRole("row", { name: /Jules DURAND/ }).getByRole("cell").first()).toHaveText("—");
    await expect(page.getByRole("row", { name: /Adam LEROY/ }).getByRole("cell").first()).toHaveText("—");
  });

  test("doublon : badge, mention sous la feuille et alerte admin", async ({ page, context }) => {
    await setGameDetailScenario("doublon");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(sheet(page).getByText("Doublon", { exact: true })).toHaveCount(2);
    await expect(sheet(page).getByText(/Certains joueurs apparaissent plusieurs fois/)).toBeVisible();
    await expect(adminAlerts(page)).toContainText("Hugo BERNARD apparaît 2 fois dans la feuille de stats");
  });
});

test.describe("Équipe et tirs", () => {
  test("stats par quart-temps et réussite aux tirs lisibles en texte", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    const quarters = page.getByRole("table", { name: "Statistiques d'équipe par quart-temps" });
    await expect(quarters.getByRole("row", { name: /Points/ })).toContainText("49");
    await expect(page.getByText("Meilleur quart-temps offensif : Q2")).toBeVisible();
    const shooting = page.getByRole("region", { name: "Réussite aux tirs de l'équipe" });
    await expect(shooting).toContainText("39,6 %");
    await expect(shooting).toContainText("21/53");
    await expect(shooting).toContainText("21 réussis · 32 manqués");
    await expect(shooting).toContainText("Aucune tentative");
  });

  test("carte : marqueurs, légende, filtres et compteur", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    const chart = shotChart(page);
    await expect(chart.getByText("10/28")).toBeVisible();
    await expect(chart.getByText("Réussi", { exact: true })).toBeVisible();
    await expect(chart.getByText("Manqué", { exact: true })).toBeVisible();
    await expect(chart.getByText("28 tirs placés sur 53 tentés", { exact: true })).toBeVisible();
    await expect(chart.getByRole("img")).toHaveAccessibleName(/Tous les joueurs, tous les quart-temps : 10 tirs réussis sur 28/);
    await chart.getByLabel("Joueur", { exact: true }).selectOption({ label: "Lucas MARTIN" });
    await expect(chart.getByText("2/6")).toBeVisible();
    await chart.getByLabel("Quart-temps", { exact: true }).selectOption({ label: "Q3" });
    await expect(chart.getByText("Aucun tir pour cette sélection.")).toBeVisible();
  });

  test("stats sans tir placé : état vide de la carte", async ({ page, context }) => {
    await setGameDetailScenario("joue");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(shotChart(page)).toContainText("Aucun tir placé pour ce match.");
  });
});

test.describe("Rôles", () => {
  test("admin : « Modifier le match » ; « Saisir les stats » seulement sans stats", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(adminActions(page).getByRole("link")).toHaveText(["Modifier le match"]);
    await setGameDetailScenario("sans-stats");
    await page.reload();
    await expect(adminActions(page).getByRole("link")).toHaveText(["Saisir les stats", "Modifier le match", "Ajouter la vidéo"]);
  });

  test("joueur : aucune action, même avec un cookie V1 « admin »", async ({ page, context }) => {
    await loginAs(context, "player");
    await context.addCookies([{ name: "user", value: JSON.stringify({ username: "admin" }), url: APP_URL }]);
    await page.goto(GAME_URL);
    await expect(page.getByRole("heading", { level: 1, name: HEADING })).toBeVisible();
    await expect(adminActions(page)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Saisir les stats" })).toHaveCount(0);
  });

  test("joueur : sa ligne marquée « (toi) » et la carte pré-filtrée sur ses tirs", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto(GAME_URL);
    await expect(page.getByRole("row", { name: /Lucas MARTIN/ })).toContainText("(toi)");
    await expect(shotChart(page).getByLabel("Joueur", { exact: true })).toHaveValue("LIC1000");
    await expect(shotChart(page).getByText("2/6")).toBeVisible();
  });

  test("écart score / stats : alerte pour l'admin seulement", async ({ page, context }) => {
    await setGameDetailScenario("ecart-score");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(adminAlerts(page)).toContainText(
      "Écart entre le score officiel (52) et la somme des points saisis (49) : 3 points.",
    );
    await context.clearCookies();
    await loginAs(context, "player");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: HEADING })).toBeVisible();
    await expect(adminAlerts(page)).toHaveCount(0);
  });

  test("aucune donnée personnelle dans la page ni dans les réponses RSC", async ({ page, context }) => {
    await loginAs(context, "admin");
    const bodies: Promise<string>[] = [];
    page.on("response", (response) => {
      if (response.url().startsWith(APP_URL)) bodies.push(response.text().catch(() => ""));
    });
    await page.goto(GAME_URL);
    await expect(sheet(page)).toBeVisible();
    await page.getByRole("button", { name: "Quart-temps 2" }).click();
    const html = await page.content();
    const all = [html, ...(await Promise.all(bodies))].join("\n");
    expect(all).not.toContain("2011-01-01");
    expect(all).not.toContain("date_naissance");
    expect(all).not.toContain("civilite");
    expect(all).not.toContain("date_physics");
  });
});

test.describe("États", () => {
  test("match à venir : ni score, ni « Score final », ni lecteur", async ({ page, context }) => {
    await setGameDetailScenario("a-venir");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByText("VS", { exact: true })).toBeVisible();
    await expect(page.getByText("À venir", { exact: true })).toBeVisible();
    await expect(page.getByText("Score final")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Lire la vidéo" })).toHaveCount(0);
    await expect(page.getByText("Les statistiques seront disponibles après le match.")).toBeVisible();
  });

  test("match joué sans stats : état vide et bouton « Saisir les stats » pour l'admin", async ({ page, context }) => {
    await setGameDetailScenario("sans-stats");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    const empty = page.getByRole("region", { name: "Statistiques du match" });
    await expect(empty).toContainText("Statistiques non saisies");
    await expect(empty.getByRole("link", { name: "Saisir les stats" })).toHaveAttribute("href", "/game/47/stat");
    await expect(page.getByText("Vidéo non disponible pour ce match.")).toBeVisible();
  });

  test("score à saisir : badge et alertes admin", async ({ page, context }) => {
    await setGameDetailScenario("score-a-saisir");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByText("Score à saisir", { exact: true })).toBeVisible();
    await expect(adminAlerts(page)).toContainText("Score à saisir : le match est passé mais le score vaut toujours 0-0.");
  });

  test("vidéo : lecteur au clic seulement ; lien invalide signalé à l'admin", async ({ page, context }) => {
    await setGameDetailScenario("video-url");
    await loginAs(context, "admin");
    const youtube: string[] = [];
    page.on("request", (request) => {
      if (/youtube/.test(new URL(request.url()).hostname)) youtube.push(request.url());
    });
    await page.goto(GAME_URL);
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(youtube).toEqual([]);
    await page.getByRole("button", { name: "Lire la vidéo" }).click();
    const frame = page.getByTitle("Vidéo du match FAC Basket contre OTB, journée 9");
    await expect(frame).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/t8QR6Oq4i5s/);

    await setGameDetailScenario("video-invalide");
    await page.reload();
    await expect(page.getByRole("button", { name: "Lire la vidéo" })).toHaveCount(0);
    await expect(adminAlerts(page)).toContainText("Lien vidéo non reconnu");
  });

  test("identifiant invalide ou inconnu : « Ce match n'existe pas », sans appel au back pour « abc »", async ({
    page,
    context,
  }) => {
    await loginAs(context, "admin");
    for (const id of ["abc", "12abc"]) {
      await page.goto(`/game/${id}`);
      await expect(page.getByRole("heading", { level: 1, name: "Ce match n'existe pas" })).toBeVisible();
    }
    expect((await getHits()).match).toBe(0);
    await page.goto("/game/999999");
    await expect(page.getByRole("heading", { level: 1, name: "Ce match n'existe pas" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Retour au calendrier" })).toHaveAttribute("href", "/game");
  });

  test("joueur sur un match hors de ses saisons : même page", async ({ page, context }) => {
    await setGameDetailScenario("joue", { saisonsJoueur: "vide" });
    await loginAs(context, "player");
    await page.goto(GAME_URL);
    await expect(page.getByRole("heading", { level: 1, name: "Ce match n'existe pas" })).toBeVisible();
  });

  test("erreur du back : message et « Réessayer »", async ({ page, context }) => {
    await setGameDetailScenario("error");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByRole("heading", { name: "Impossible de charger le match" })).toBeVisible();
    await setGameDetailScenario("joue");
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(page.getByRole("heading", { level: 1, name: HEADING })).toBeVisible();
  });

  test("format invalide : seul le bloc concerné tombe", async ({ page, context }) => {
    await setGameDetailScenario("tirs-invalides");
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByRole("alert").filter({ hasText: "Carte des tirs" })).toContainText("Impossible de charger ce bloc");
    await expect(sheet(page)).toBeVisible();

    await setGameDetailScenario("format-invalide");
    await page.reload();
    await expect(page.getByRole("alert").filter({ hasText: "Statistiques du match" })).toContainText(
      "Impossible de charger ce bloc",
    );
    await expect(page.getByRole("heading", { level: 1, name: HEADING })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lire la vidéo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Saisir les stats" })).toHaveCount(0);
  });

  test("un seul appel à /api/matchs/{id} par affichage", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(shotChart(page)).toBeVisible();
    expect((await getHits()).match).toBe(1);
  });
});

test.describe("Fuseau horaire", () => {
  test.use({ timezoneId: "America/Martinique" });

  test("la date affichée ne recule pas d'un jour", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.getByText("Samedi 24 janvier 2026", { exact: true })).toBeVisible();
  });
});

test.describe("Accessibilité et mise en page", () => {
  test("noms accessibles, aucun bouton dans un lien, langue française", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("group", { name: "Période affichée" }).getByRole("button", { name: "Tout" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(shotChart(page).getByLabel("Joueur", { exact: true })).toBeVisible();
    await expect(shotChart(page).getByLabel("Quart-temps", { exact: true })).toBeVisible();
    await expect(page.locator("a button, a [role=button]")).toHaveCount(0);
    await expect(shotChart(page).locator("svg[role=img] > title")).toHaveCount(1);
  });

  for (const width of [1180, 400]) {
    test(`aucun défilement horizontal de la page à ${width} px`, async ({ page, context }) => {
      await page.setViewportSize({ width, height: 820 });
      await loginAs(context, "admin");
      await page.goto(GAME_URL);
      await expect(sheet(page)).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("tablette paysage : toutes les colonnes de la feuille sans défiler le tableau", async ({ page, context }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await loginAs(context, "admin");
    await page.goto(GAME_URL);
    const box = sheet(page).getByRole("region");
    const overflow = await box.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
