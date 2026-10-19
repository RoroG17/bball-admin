import { expect, test, type Page } from "@playwright/test";
import { APP_URL, getHits, getWrites, loginAs, setAdminScenario } from "./helpers";

/*
 * Saisons (spec § 8, critères corrigés par D-ADM-1 à D-ADM-5 et D-S1 / D-S3 / D-S4 / D-S5 / D-S8 / D-S9). Fixtures
 * reconstruites : `tests/fixtures/admin-season/`. Magasin du faux back par défaut : saison 4 (2025-2026 · D1 · U15G, FAC
 * Basket, 18 matchs de 10 lignes de stats, 12 participants) et saison 1 (2024-2025 · D3 · U15G, 14 matchs, 3 participants).
 * Scénario `multi` : 5 saisons dont la 6 (2025-2026 · Régionale 2 · Senior, JS Cugnaux, sans participant) et la 5 (sans équipe).
 */
const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
const teamField = (page: Page) => page.getByRole("combobox", { name: "Équipe RPB" });
const rows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });
const appWrites = async () => (await getWrites()).filter((write) => write.authorization !== null);

async function fillSeason(page: Page, values: { start?: string; end?: string; championship?: string; category?: string; team?: string | null } = {}) {
  await field(page, "Année de début").fill(values.start ?? "2026");
  await field(page, "Année de fin").fill(values.end ?? "2027");
  await field(page, "Championnat").fill(values.championship ?? "Régionale 2");
  await field(page, "Catégorie").fill(values.category ?? "Senior");
  if (values.team !== null) await teamField(page).selectOption({ label: values.team ?? "FAC Basket" });
}

test.beforeEach(async ({ context }) => {
  await setAdminScenario();
  await loginAs(context, "admin");
});

test.describe("Accès", () => {
  for (const route of ["/admin/season", "/admin/season/create", "/admin/season/4/edit", "/admin/season/4/delete"]) {
    test(`joueur sur ${route} : « Accès refusé », aucun appel de données ni écriture`, async ({ page, context }) => {
      await context.clearCookies();
      await loginAs(context, "player");
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1, name: "Accès refusé" })).toBeVisible();
      expect((await getHits()).adminReads).toBe(0);
      expect(await getWrites()).toEqual([]);
    });
  }

  test("une action appelée avec une session joueur ne produit aucune écriture", async ({ page, context }) => {
    await page.goto("/admin/season/create");
    await fillSeason(page);
    await context.clearCookies();
    await loginAs(context, "player");
    await page.getByRole("button", { name: "Créer la saison" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Action réservée aux administrateurs." })).toBeVisible();
    expect(await getWrites()).toEqual([]);
  });
});

test.describe("Liste", () => {
  test("de la plus récente à la plus ancienne, nom de l'équipe, badge « Plus récente » sur une seule ligne", async ({ page }) => {
    await page.goto("/admin/season");
    await expect(page.getByRole("heading", { level: 1, name: "Saisons" })).toBeVisible();
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).nth(0)).toContainText("2025-2026");
    await expect(rows(page).nth(0)).toContainText("D1");
    await expect(rows(page).nth(0)).toContainText("FAC Basket");
    await expect(rows(page).nth(1)).toContainText("2024-2025");
    await expect(page.getByTitle("Saison la plus récente : affichée par défaut dans l'application")).toHaveCount(1);
    await expect(rows(page).nth(0)).toContainText("Plus récente");
  });

  test("saison sans équipe : « Équipe RPB non renseignée »", async ({ page }) => {
    await setAdminScenario({ saisons: "sans-equipe" });
    await page.goto("/admin/season");
    await expect(rows(page).nth(1)).toContainText("Équipe RPB non renseignée");
  });

  test("équipes illisibles : liste affichée avec « Équipe n° 1 » et mention", async ({ page }) => {
    await setAdminScenario({ equipes: "error" });
    await page.goto("/admin/season");
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).nth(0)).toContainText("Équipe n° 1");
    await expect(page.getByText("Les noms des équipes n'ont pas pu être chargés")).toBeVisible();
  });

  test("back indisponible : erreur de bloc avec « Réessayer », jamais une liste vide", async ({ page }) => {
    await setAdminScenario({ adminSeason: "error" });
    await page.goto("/admin/season");
    await expect(page.getByRole("alert").filter({ hasText: "Liste des saisons" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await setAdminScenario();
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(rows(page)).toHaveCount(2);
  });

  test("aucune saison : état vide avec bouton de création", async ({ page }) => {
    await setAdminScenario({ adminSeason: "vide" });
    await page.goto("/admin/season");
    await expect(page.getByText("Aucune saison", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Créer une saison" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season/create`);
  });

  test("deux saisons de même année : ordre déterministe (la plus grande id d'abord) ; recherche sans accents ni casse ; tri", async ({ page }) => {
    await setAdminScenario({ adminSeason: "multi" });
    await page.goto("/admin/season");
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).nth(0)).toContainText("Régionale 2");
    await expect(rows(page).nth(0)).toContainText("Plus récente");
    await page.getByRole("searchbox", { name: "Rechercher une saison" }).fill("DEPARTEMENTALE");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season?q=DEPARTEMENTALE`);
    await expect(rows(page)).toHaveCount(1);
    await page.goto("/admin/season?q=zzzz");
    await expect(page.getByText("Aucune saison ne correspond à « zzzz »")).toBeVisible();
    await page.goto("/admin/season");
    await page.getByRole("columnheader", { name: /Championnat/ }).getByRole("link").click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season?tri=championship&ordre=asc`);
    await expect(rows(page).nth(0)).toContainText("D1");
  });

  test("actions nommées avec la saison", async ({ page }) => {
    await page.goto("/admin/season");
    await page.getByRole("link", { name: "Modifier 2025-2026 · D1 · U15G" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season/4/edit`);
  });
});

test.describe("Création", () => {
  test("années par défaut, équipes déjà utilisées d'abord, parcours complet au clavier, redirection vers l'édition avec bandeau", async ({ page }) => {
    await page.goto("/admin/season/create");
    await expect(field(page, "Année de début")).toHaveValue(/^20\d\d$/);
    const start = Number(await field(page, "Année de début").inputValue());
    await expect(field(page, "Année de fin")).toHaveValue(String(start + 1));
    await expect(teamField(page)).toHaveValue("");
    await expect(teamField(page).locator("option").nth(1)).toHaveText("FAC Basket");

    await field(page, "Année de début").fill("2026");
    await page.keyboard.press("Tab");
    await page.keyboard.type("2027");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Régionale 2");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Senior");
    await page.keyboard.press("Tab");
    await teamField(page).selectOption({ label: "FAC Basket" });
    await page.getByRole("button", { name: "Créer la saison" }).click();

    await expect(page).toHaveURL(`${APP_URL}/admin/season/5/edit`);
    await expect(page.getByRole("status").filter({ hasText: "Saison « 2026-2027 · Régionale 2 · Senior » créée." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Participants" })).toBeVisible();
    const writes = await appWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "POST", path: "/api/saisons" });
    expect(writes[0].body).toEqual({ annee_debut: 2026, annee_fin: 2027, championnat: "Régionale 2", categorie: "Senior", equipe: 1 });
  });

  test("champs vides, années incohérentes, équipe non choisie : erreur sous le champ, zéro écriture, focus, jamais equipe = 0", async ({ page }) => {
    await page.goto("/admin/season/create");
    await field(page, "Année de début").fill("");
    await field(page, "Championnat").fill("");
    await page.getByRole("button", { name: "Créer la saison" }).click();
    await expect(field(page, "Année de début")).toHaveAccessibleDescription(/Renseigne l'année de début/);
    await expect(field(page, "Championnat")).toHaveAccessibleDescription(/Renseigne le championnat/);
    await expect(teamField(page)).toHaveAccessibleDescription(/Choisis l'équipe RPB de la saison/);
    await expect(field(page, "Année de début")).toBeFocused();

    await fillSeason(page, { start: "2026", end: "2024", team: null });
    await page.getByRole("button", { name: "Créer la saison" }).click();
    await expect(field(page, "Année de fin")).toHaveAccessibleDescription(/L'année de fin doit être l'année de début ou la suivante/);
    expect(await getWrites()).toEqual([]);
  });

  test("doublon strict refusé (casse et accents ignorés), aucune écriture", async ({ page }) => {
    await page.goto("/admin/season/create");
    await fillSeason(page, { start: "2025", end: "2026", championship: " d1 ", category: "u15g" });
    await page.getByRole("button", { name: "Créer la saison" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Une saison identique existe déjà" })).toBeVisible();
    expect(await getWrites()).toEqual([]);
  });

  test("422 du back : erreur sur le champ concerné, en français", async ({ page }) => {
    await setAdminScenario({ adminWrite: "422" });
    await page.goto("/admin/season/create");
    await fillSeason(page);
    await page.getByRole("button", { name: "Créer la saison" }).click();
    await expect(field(page, "Année de début")).toHaveAccessibleDescription("Ce champ est obligatoire.");
    await expect(page.getByText("The annee debut")).toHaveCount(0);
  });

  test("500 du back : message d'erreur, saisie conservée", async ({ page }) => {
    await setAdminScenario({ adminWrite: "error" });
    await page.goto("/admin/season/create");
    await fillSeason(page);
    await page.getByRole("button", { name: "Créer la saison" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Le serveur a refusé l'opération" })).toBeVisible();
    await expect(field(page, "Championnat")).toHaveValue("Régionale 2");
  });

  test("double clic « Créer » : une seule écriture", async ({ page }) => {
    await setAdminScenario({ adminWrite: "slow" });
    await page.goto("/admin/season/create");
    await fillSeason(page);
    await page.getByRole("button", { name: "Créer la saison" }).dblclick();
    await expect(page).toHaveURL(/\/admin\/season\/5\/edit/);
    expect((await appWrites()).filter((write) => write.method === "POST")).toHaveLength(1);
  });

  test("équipes illisibles : pas de formulaire, erreur de bloc avec « Réessayer »", async ({ page }) => {
    await setAdminScenario({ equipes: "error" });
    await page.goto("/admin/season/create");
    await expect(page.getByRole("alert").filter({ hasText: "Formulaire de la saison" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer la saison" })).toHaveCount(0);
  });
});

test.describe("Modification", () => {
  test("pré-rempli, indice permanent sur l'équipe avec le nombre de matchs, enregistrement puis retour à la liste", async ({ page }) => {
    await page.goto("/admin/season/4/edit");
    await expect(field(page, "Année de début")).toHaveValue("2025");
    await expect(field(page, "Catégorie")).toHaveValue("U15G");
    await expect(teamField(page)).toHaveValue("1");
    await expect(page.getByText("Changer l'équipe recalcule le bilan des 18 matchs de cette saison.")).toBeVisible();
    await field(page, "Catégorie").fill("U17G");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season`);
    await expect(page.getByRole("status").filter({ hasText: "Saison « 2025-2026 · D1 · U17G » modifiée." })).toBeVisible();
    await expect(rows(page).first()).toContainText("U17G");
    const writes = await appWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "PUT", path: "/api/saisons/4" });
  });

  test("saison inexistante ou identifiant invalide : « Saison introuvable », pas de formulaire", async ({ page }) => {
    for (const id of ["999", "abc"]) {
      await page.goto(`/admin/season/${id}/edit`);
      await expect(page.getByRole("heading", { name: "Saison introuvable" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Enregistrer les modifications" })).toHaveCount(0);
    }
  });

  test("saison sans équipe : liste sans sélection et avertissement", async ({ page }) => {
    await setAdminScenario({ saisons: "sans-equipe" });
    await page.goto("/admin/season/1/edit");
    await expect(teamField(page)).toHaveValue("");
    await expect(page.getByText("Cette saison n'a pas d'équipe RPB")).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(teamField(page)).toHaveAccessibleDescription(/Choisis l'équipe RPB de la saison/);
    expect(await getWrites()).toEqual([]);
  });

  test("lecture en échec : page d'erreur, jamais un formulaire vide", async ({ page }) => {
    await setAdminScenario({ adminSeason: "error" });
    await page.goto("/admin/season/4/edit");
    await expect(page.getByRole("button", { name: "Enregistrer les modifications" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
  });
});

test.describe("Suppression (D-ADM-1 : jamais de blocage)", () => {
  test("confirmation chiffrée : matchs, inscriptions, lignes de statistiques ; « Annuler » sans écriture", async ({ page }) => {
    await page.goto("/admin/season/4/delete");
    await expect(page.getByRole("heading", { name: "Supprimer la saison 2025-2026 · D1 · U15G ?" })).toBeVisible();
    await expect(page.getByText("18 matchs", { exact: true })).toBeVisible();
    await expect(page.getByText("12 inscriptions à une saison")).toBeVisible();
    await expect(page.getByText("180 lignes de statistiques de match (tirs compris)")).toBeVisible();
    await page.getByRole("link", { name: "Annuler" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season`);
    expect(await getWrites()).toEqual([]);
  });

  test("succès : un seul DELETE, saison retirée de la liste, « Saison supprimée. »", async ({ page }) => {
    await page.goto("/admin/season/1/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season`);
    await expect(page.getByRole("status").filter({ hasText: "Saison supprimée." })).toBeVisible();
    await expect(rows(page)).toHaveCount(1);
    const writes = await appWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "DELETE", path: "/api/saisons/1" });
  });

  test("un match illisible : « nombre indéterminé » et bouton conservé", async ({ page }) => {
    await setAdminScenario({ match: "error" });
    await page.goto("/admin/season/4/delete");
    await expect(page.getByText("un nombre indéterminé de lignes de statistiques de match (tirs compris)")).toBeVisible();
    await expect(page.getByText("18 matchs", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toBeVisible();
  });

  test("impact illisible (matchs) : bouton absent, « Réessayer »", async ({ page }) => {
    await setAdminScenario({ matchs: "error" });
    await page.goto("/admin/season/4/delete");
    await expect(page.getByRole("alert").filter({ hasText: "Données qui seront supprimées" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
  });

  test("le back refuse (cascade manquante) : message de suppression échouée, la saison reste", async ({ page }) => {
    await setAdminScenario({ adminWrite: "error" });
    await page.goto("/admin/season/4/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "La suppression a échoué" })).toBeVisible();
    await page.goto("/admin/season");
    await expect(rows(page)).toHaveCount(2);
  });

  test("saison déjà supprimée (404) : « n'existe plus »", async ({ page }) => {
    await setAdminScenario({ adminWrite: "404" });
    await page.goto("/admin/season/4/delete");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByRole("heading", { name: "Saison introuvable" })).toBeVisible();
  });

  test("saison inexistante : « Saison introuvable »", async ({ page }) => {
    await page.goto("/admin/season/999/delete");
    await expect(page.getByRole("heading", { name: "Saison introuvable" })).toBeVisible();
  });
});

test.describe("Participants (D-S1 : enregistrés à chaque clic)", () => {
  test("liste avec compteur, texte explicite, inscrits non filtrés par la recherche", async ({ page }) => {
    await page.goto("/admin/season/4/edit");
    await expect(page.getByRole("heading", { level: 3, name: "12 participants" })).toBeVisible();
    await expect(page.getByText("sont enregistrés immédiatement")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retirer Lucas MARCHAND de la saison" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Rechercher un joueur à inscrire" }).fill("zzz");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin/season/4/edit?q=zzz#participants`);
    await expect(page.getByRole("heading", { level: 3, name: "12 participants" })).toBeVisible();
    await expect(page.getByText("Aucun joueur non inscrit ne correspond à « zzz ».")).toBeVisible();
  });

  test("aucun inscrit : état vide ; recherche « elodie » trouve « Élodie »", async ({ page }) => {
    await setAdminScenario({ adminSeason: "multi" });
    await page.goto("/admin/season/6/edit");
    await expect(page.getByRole("heading", { level: 3, name: "0 participant" })).toBeVisible();
    await expect(page.getByText("Aucun joueur inscrit sur cette saison.")).toBeVisible();
    await page.getByRole("searchbox", { name: "Rechercher un joueur à inscrire" }).fill("elodie");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page.getByRole("button", { name: /^Inscrire Élodie ROUSSEL/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Inscrire/ })).toHaveCount(1);
  });

  test("inscription : un seul POST, annonce en role=status, focus sur l'annonce, joueur déplacé et compteur à jour", async ({ page }) => {
    await setAdminScenario({ adminSeason: "multi" });
    await page.goto("/admin/season/6/edit?q=elodie");
    await page.getByRole("button", { name: "Inscrire Élodie ROUSSEL à la saison" }).click();
    const status = page.getByRole("status").filter({ hasText: "Inscription enregistrée : Élodie ROUSSEL." });
    await expect(status).toBeVisible();
    await expect(status).toBeFocused();
    await expect(page.getByRole("heading", { level: 3, name: "1 participant" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retirer Élodie ROUSSEL de la saison" })).toBeVisible();
    const writes = await appWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "POST", path: "/api/participer", body: { Id_Saison: 6, licence: "LIC2000" } });
  });

  test("double clic = une participation", async ({ page }) => {
    await setAdminScenario({ adminSeason: "multi" });
    await page.goto("/admin/season/6/edit?q=elodie");
    await page.getByRole("button", { name: "Inscrire Élodie ROUSSEL à la saison" }).dblclick();
    await expect(page.getByRole("heading", { level: 3, name: "1 participant" })).toBeVisible();
    expect((await appWrites()).filter((write) => write.method === "POST")).toHaveLength(1);
    const detail = await (await fetch("http://localhost:4010/api/saisons/6")).json();
    expect(detail.participer).toEqual([{ licence: "LIC2000" }]);
  });

  test("déjà inscrit dans un autre onglet : « Déjà inscrit », zéro POST de l'application", async ({ page }) => {
    await setAdminScenario({ adminSeason: "multi" });
    await page.goto("/admin/season/6/edit?q=elodie");
    await fetch("http://localhost:4010/api/participer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Id_Saison: 6, licence: "LIC2000" }),
    });
    await page.getByRole("button", { name: "Inscrire Élodie ROUSSEL à la saison" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Déjà inscrit : Élodie ROUSSEL. Rien n'a été modifié." })).toBeVisible();
    expect(await appWrites()).toEqual([]);
  });

  test("retrait : DELETE avec le couple dans le corps, compteur à jour", async ({ page }) => {
    await page.goto("/admin/season/1/edit");
    await expect(page.getByRole("heading", { level: 3, name: "3 participants" })).toBeVisible();
    await page.getByRole("button", { name: "Retirer Lucas MARCHAND de la saison" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Retrait enregistré : Lucas MARCHAND." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "2 participants" })).toBeVisible();
    const writes = await appWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "DELETE", path: "/api/participer", body: { Id_Saison: 1, licence: "LIC1000" } });
  });

  test("échec : message annoncé en role=alert, la ligne reste dans sa liste", async ({ page }) => {
    await setAdminScenario({ adminWrite: "error" });
    await page.goto("/admin/season/4/edit");
    await page.getByRole("button", { name: "Retirer Lucas MARCHAND de la saison" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Le serveur a refusé l'opération" });
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();
    await expect(page.getByRole("heading", { level: 3, name: "12 participants" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retirer Lucas MARCHAND de la saison" })).toBeVisible();
  });

  test("« Fermer » vide l'annonce", async ({ page }) => {
    await page.goto("/admin/season/1/edit");
    await page.getByRole("button", { name: "Retirer Lucas MARCHAND de la saison" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Retrait enregistré" })).toBeVisible();
    await page.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Retrait enregistré" })).toHaveCount(0);
  });

  test("après inscription, le joueur trouve la saison dans son périmètre (accueil)", async ({ page, context }) => {
    await setAdminScenario({ adminSeason: "multi" });
    await page.goto("/admin/season/6/edit?q=lucas");
    await page.getByRole("button", { name: "Inscrire Lucas MARCHAND à la saison" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "1 participant" })).toBeVisible();

    await context.clearCookies();
    await loginAs(context, "player");
    await page.goto("/");
    // La saison 6 (2025-2026, id la plus grande) devient la plus récente de ses saisons.
    await expect(page).toHaveURL(/\/\?saison=6$/);
  });
});

test.describe("Textes", () => {
  test("aucun texte anglais visible sur les quatre écrans", async ({ page }) => {
    for (const route of ["/admin/season", "/admin/season/create", "/admin/season/4/edit", "/admin/season/4/delete"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const text = await page.locator("main.anim").innerText();
      expect(text, route).not.toMatch(/\b(Loading|Submit|Delete|Edit|Cancel|Save|Season|Participants?:)\b/);
    }
  });
});
