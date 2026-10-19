import { expect, test, type Page } from "@playwright/test";
import { capitalizeFirst, formatGameDate } from "../../lib/format";
import { getParisIsoDate } from "../../models/getParisIsoDate";
import { getTeamInitials } from "../../models/getTeamInitials";
import { APP_URL, getHits, loginAs, setCalendarScenario } from "./helpers";

/** Date de Paris décalée de `days` jours, comme les marqueurs `@today±n` du faux back. */
function parisDatePlus(days: number): string {
  const [y, m, d] = getParisIsoDate(new Date()).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const summary = (page: Page) => page.getByRole("region", { name: "Bilan de la saison" });
const upcoming = (page: Page) => page.getByRole("region", { name: "À venir" });
const results = (page: Page) => page.getByRole("region", { name: "Résultats" });

test.beforeEach(async () => {
  await setCalendarScenario();
});

test.describe("Saison affichée", () => {
  test("sans paramètre, redirige vers la saison la plus récente et affiche ses matchs", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game");
    await expect(page).toHaveURL(/\/game\?saison=4$/);
    await expect(page.getByLabel("Saison affichée")).toHaveValue("4");
    await expect(page.getByText("Saison 2025-2026 · D1 · U15G")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Calendrier" })).toBeVisible();
    const row = page.getByRole("link", { name: /journée 1,.*victoire 53 à 34/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Coq Carlanais Basket");
    await expect(row).toContainText("Score final");
  });

  test("changer de saison met à jour l'URL, le bilan et la liste ; rechargement et Retour suivent", async ({
    page,
    context,
  }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(summary(page)).toContainText("18 matchs au programme");
    await page.getByLabel("Saison affichée").selectOption("1");
    await expect(page).toHaveURL(/\/game\?saison=1$/);
    await expect(page.getByText("Saison 2024-2025 · D3 · U15G")).toBeVisible();
    await expect(summary(page)).toContainText("14 matchs au programme");
    await page.reload();
    await expect(page.getByLabel("Saison affichée")).toHaveValue("1");
    await page.goBack();
    await expect(page).toHaveURL(/\/game\?saison=4$/);
    await expect(summary(page)).toContainText("18 matchs au programme");
  });

  test("un clic sur un match ouvre sa fiche", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await page.getByRole("link", { name: /journée 1,/ }).click();
    await expect(page).toHaveURL(/\/game\/36$/);
  });

  test("un joueur ne voit que ses saisons et ne peut pas forcer une autre saison", async ({ page, context }) => {
    await loginAs(context, "player");
    await page.goto("/game?saison=999");
    await expect(page).toHaveURL(/\/game\?saison=4$/);
    await expect(page.getByLabel("Saison affichée").locator("option")).toHaveCount(2);
  });

  test("le cookie `user` de la V1 n'a aucun effet sur le rôle", async ({ page, context }) => {
    await setCalendarScenario({ saisonsJoueur: "vide" });
    await loginAs(context, "player");
    await context.addCookies([{ name: "user", value: JSON.stringify({ username: "admin" }), url: APP_URL }]);
    await page.goto("/game");
    await expect(page.getByText("Tu n'es inscrit à aucune saison.")).toBeVisible();
  });

  test("joueur sans saison : message dédié, aucun match", async ({ page, context }) => {
    await setCalendarScenario({ saisonsJoueur: "vide" });
    await loginAs(context, "player");
    await page.goto("/game");
    await expect(page.getByText("Tu n'es inscrit à aucune saison.")).toBeVisible();
    await expect(page.getByRole("link", { name: /journée/ })).toHaveCount(0);
  });
});

test.describe("Bilan", () => {
  test("affiche le bilan calculé sur les matchs joués", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    const block = summary(page);
    await expect(block).toContainText("18 matchs au programme");
    await expect(block).toContainText("8 victoires, 4 défaites, 1 nul");
    await expect(block).toContainText("1 match nul");
    await expect(block).toContainText("Matchs joués13");
    await expect(block).toContainText("723");
    await expect(block).toContainText("Moy. 55,6");
    await expect(block).toContainText("661");
    await expect(block).toContainText("Moy. 50,8");
    await expect(block).toContainText("+62");
    await expect(block).toContainText("+4,8 par match");
    await expect(block).toContainText("Matchs restants4");
    await expect(block).toContainText("1 match passé sans score saisi, non compté dans le bilan.");
  });

  test("saison sans équipe RPB : bilan non calculable, liste affichée sans résultat", async ({ page, context }) => {
    await setCalendarScenario({ saisons: "sans-equipe", matchs: "fin-saison" });
    await loginAs(context, "admin");
    await page.goto("/game?saison=1");
    await expect(page.getByText("Bilan non calculable")).toBeVisible();
    await expect(results(page).getByRole("listitem")).toHaveCount(14);
    await expect(results(page)).not.toContainText("Victoire");
  });

  test("équipe RPB indisponible : bilan en erreur, liste affichée ; « Réessayer » rétablit le bilan", async ({
    page,
    context,
  }) => {
    await setCalendarScenario({ equipe: "error" });
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.locator("main").getByRole("alert")).toContainText("Bilan de la saison");
    await expect(page.getByText("Victoires, défaites et domicile / extérieur indisponibles pour le moment.")).toBeVisible();
    await expect(results(page).getByRole("listitem")).toHaveCount(14);
    await setCalendarScenario({ equipe: "ok" });
    await page.locator("main").getByRole("alert").getByRole("button", { name: "Réessayer" }).click();
    await expect(summary(page)).toContainText("8 victoires, 4 défaites, 1 nul");
  });
});

test.describe("Matchs", () => {
  test("un match à venir n'a pas de score ; un 0-0 passé est « Score à saisir »", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    const next = upcoming(page).getByRole("link", { name: /journée 16,.*à venir/ });
    await expect(next).toContainText("VS");
    await expect(next).not.toContainText("Score final");
    await expect(next).not.toContainText("0 – 0");
    const missing = results(page).getByRole("link", { name: /journée 14,.*score à saisir/ });
    await expect(missing).toContainText("Score à saisir");
    await expect(missing).not.toContainText("Score final");
  });

  test("le prochain match est mis en avant", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    const card = page.getByRole("link", { name: /^Prochain match, dans 3 jours : FAC Basket contre TIGER'S, journée 15/ });
    await expect(card).toContainText("Dans 3 jours");
    await expect(card).toContainText("À domicile");
    await expect(card).not.toContainText("Score final");
    await expect(upcoming(page)).toContainText("3 autres matchs");
    await expect(results(page)).toContainText("14 matchs");
  });

  test("fin de saison : pas de prochain match, aucun message d'erreur", async ({ page, context }) => {
    await setCalendarScenario({ matchs: "fin-saison" });
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.getByText("Aucun match à venir : la saison est terminée.")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Prochain match/ })).toHaveCount(0);
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  });

  test("un nul s'affiche « Nul » et n'est compté ni en victoire ni en défaite", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(results(page).getByRole("link", { name: /journée 12,.*match nul 70 à 70/ })).toContainText("Nul");
    await expect(summary(page)).toContainText("8 V – 4 D");
  });

  test("erreur sur la liste des matchs : les deux blocs en erreur, en-tête conservé", async ({ page, context }) => {
    await setCalendarScenario({ matchs: "error" });
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.locator("main").getByRole("alert")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Réessayer" })).toHaveCount(2);
    await expect(page.getByLabel("Saison affichée")).toBeVisible();
  });

  test("saison sans match : un seul message", async ({ page, context }) => {
    await setCalendarScenario({ matchs: "vide" });
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.getByText("Aucun match pour cette saison.")).toBeVisible();
    await expect(page.getByText("Aucun match programmé sur cette saison.")).toBeVisible();
  });

  test("logo absent : initiales à la place", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.getByRole("link", { name: /journée 16,/ })).toContainText(getTeamInitials("AS Labarthe-sur-Lèze"));
  });

  test("un seul appel à /api/matchs et à /api/equipes par affichage", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(summary(page)).toContainText("8 V – 4 D");
    await expect(results(page).getByRole("listitem")).toHaveCount(14);
    expect(await getHits()).toMatchObject({ matchs: 1, equipes: 1 });
  });
});

test.describe("Fuseau horaire", () => {
  test.use({ timezoneId: "America/Martinique" });

  test("la date affichée est celle de Paris, quel que soit le fuseau du navigateur", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.getByRole("link", { name: /^Prochain match/ })).toContainText(
      capitalizeFirst(formatGameDate(parisDatePlus(3))),
    );
  });
});

test.describe("Accessibilité et mise en page", () => {
  test("libellés en texte, noms de liens concis, langue française", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByLabel("Saison affichée")).toBeVisible();
    await expect(page.getByRole("link", { name: /journée 5,/ })).toHaveCount(1);
    await expect(results(page).getByText("Victoire").first()).toBeVisible();
    await expect(results(page).getByText("Défaite").first()).toBeVisible();
    await expect(results(page).getByText("À domicile").first()).toBeVisible();
    await expect(results(page).getByText("À l'extérieur").first()).toBeVisible();
  });

  for (const viewport of [
    { width: 1180, height: 820 },
    { width: 400, height: 860 },
  ]) {
    test(`aucun défilement horizontal à ${viewport.width} px`, async ({ page, context }) => {
      await page.setViewportSize(viewport);
      await loginAs(context, "admin");
      await page.goto("/game?saison=4");
      await expect(results(page).getByRole("listitem")).toHaveCount(14);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
