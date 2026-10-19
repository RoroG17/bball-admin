import { expect, test, type Page } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "../../lib/sessionCookie";
import { signSessionToken } from "../../lib/sessionToken";
import { APP_URL, getHits, loginAs, setAuthScenario } from "./helpers";

test.beforeEach(async () => {
  await setAuthScenario();
});

/** L'alerte du formulaire (Next ajoute son propre `role="alert"` pour annoncer les changements de page). */
const formAlert = (page: Page) => page.getByRole("region", { name: "Connexion" }).getByRole("alert");

async function submitLogin(page: Page, username: string, password = "") {
  await page.getByLabel("Identifiant").fill(username);
  if (password) await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe("Accès et retour à la page demandée", () => {
  test("sans session : connexion avec la page et ses paramètres, puis retour", async ({ page }) => {
    await page.goto("/game?saison=4");
    await expect(page).toHaveURL(`${APP_URL}/login?redirect=%2Fgame%3Fsaison%3D4`);
    await expect(page.getByRole("heading", { level: 1, name: "Connexion" })).toBeVisible();
    await expect(page.getByLabel("Identifiant")).toBeFocused();

    await submitLogin(page, "admin", "admin-e2e");
    await expect(page).toHaveURL(`${APP_URL}/game?saison=4`);
    await expect(page.getByRole("heading", { level: 1, name: "Calendrier" })).toBeVisible();
  });

  test("une redirection vers un autre site est ignorée", async ({ page }) => {
    for (const target of ["//evil.com", "https://evil.com"]) {
      await page.context().clearCookies();
      await page.goto(`/login?redirect=${encodeURIComponent(target)}`);
      await submitLogin(page, "admin", "admin-e2e");
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/(\?saison=4)?$/);
    }
  });

  test("déjà connecté : /login renvoie vers l'application", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/login");
    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/(\?saison=4)?$/);
  });
});

test.describe("Erreurs de connexion", () => {
  test("compte inconnu, mot de passe faux ou absent : même message, identifiant conservé", async ({ page }) => {
    await page.goto("/login");
    for (const [username, password] of [
      ["inconnu", "x"],
      ["admin", "mauvais"],
      ["admin", ""],
    ]) {
      await submitLogin(page, username, password);
      await expect(formAlert(page)).toHaveText("Identifiant ou mot de passe incorrect.");
      await expect(page.getByLabel("Identifiant")).toHaveValue(username);
      await expect(page.getByLabel("Mot de passe", { exact: true })).toHaveValue("");
    }
  });

  test("panne du back : message de service distinct", async ({ page }) => {
    await setAuthScenario({ auth: "indisponible" });
    await page.goto("/login");
    await submitLogin(page, "admin", "admin-e2e");
    await expect(formAlert(page)).toHaveText(
      "Le service est momentanément indisponible. Vérifie ta connexion puis réessaie.",
    );
  });

  test("trop de tentatives : message dédié", async ({ page }) => {
    await setAuthScenario({ auth: "limite" });
    await page.goto("/login");
    await submitLogin(page, "admin", "admin-e2e");
    await expect(formAlert(page)).toHaveText("Trop de tentatives. Patiente quelques minutes avant de réessayer.");
  });

  test("pendant la requête, le bouton est désactivé", async ({ page }) => {
    await setAuthScenario({ auth: "lent" });
    await page.goto("/login");
    await submitLogin(page, "admin", "admin-e2e");
    await expect(page.getByRole("button", { name: "Connexion en cours…" })).toBeDisabled();
    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/(\?saison=4)?$/);
  });

  test("identifiant vide : erreur de champ, aucun appel au back", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Saisis ton identifiant.")).toBeVisible();
    await expect(page.getByLabel("Identifiant")).toHaveAttribute("aria-invalid", "true");
    expect((await getHits()).connect).toBe(0);
  });
});

test.describe("Session", () => {
  test("le jeton est dans un cookie HttpOnly, illisible par un script ; aucun cookie d'identité modifiable", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await submitLogin(page, "admin", "admin-e2e");
    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/(\?saison=4)?$/);

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);
    expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax" });
    expect(cookies.map((cookie) => cookie.name)).not.toContain("user");
    expect(cookies.map((cookie) => cookie.name)).not.toContain("auth_token");
    expect(await page.evaluate(() => document.cookie)).not.toContain(SESSION_COOKIE_NAME);
    const hits = await getHits();
    expect(hits.csrf).toBe(0);
  });

  test("un cookie forgé (signé avec un autre secret) est refusé", async ({ page, context }) => {
    const forged = await signSessionToken(
      { username: "admin", licence: null, token: "x" },
      "un-autre-secret-un-autre-secret-un-autre",
    );
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: forged, url: APP_URL }]);
    await page.goto("/game?saison=4");
    await expect(page).toHaveURL(`${APP_URL}/login?reason=expired&redirect=%2Fgame%3Fsaison%3D4`);
    await expect(page.getByRole("status")).toHaveText("Ta session a expiré. Reconnecte-toi pour continuer.");
  });

  test("jeton refusé par le back (401) : « session expirée », cookie supprimé, puis retour", async ({
    page,
    context,
  }) => {
    await setAuthScenario({ session401: true });
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page).toHaveURL(`${APP_URL}/login?reason=expired&redirect=%2Fgame%3Fsaison%3D4`);
    await expect(page.getByRole("status")).toHaveText("Ta session a expiré. Reconnecte-toi pour continuer.");
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain(SESSION_COOKIE_NAME);

    await setAuthScenario();
    await submitLogin(page, "admin", "admin-e2e");
    await expect(page).toHaveURL(`${APP_URL}/game?saison=4`);
  });

  test("une panne du back ne déconnecte pas", async ({ page, context }) => {
    await setAuthScenario({ matchs: "error" });
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.getByRole("button", { name: "Réessayer" }).first()).toBeVisible();
    await expect(page).toHaveURL(`${APP_URL}/game?saison=4`);
    expect((await context.cookies()).map((cookie) => cookie.name)).toContain(SESSION_COOKIE_NAME);
  });
});

test.describe("Première connexion", () => {
  test("compte sans mot de passe : création puis connexion automatique", async ({ page }) => {
    await page.goto("/login");
    await submitLogin(page, "nouveau.joueur");
    await expect(page).toHaveURL(`${APP_URL}/init-password`);
    await expect(page.getByRole("heading", { level: 1, name: "Créer ton mot de passe" })).toBeVisible();
    await expect(page.getByText("nouveau.joueur", { exact: true })).toBeVisible();
    await expect(page.getByText("8 caractères minimum, 72 maximum.", { exact: false })).toBeVisible();

    const submit = page.getByRole("button", { name: "Définir mon mot de passe" });
    await page.getByLabel("Nouveau mot de passe").fill("court");
    await page.getByLabel("Confirmer le mot de passe").fill("court");
    await submit.click();
    await expect(page.getByText("Le mot de passe doit contenir au moins 8 caractères.")).toBeVisible();

    await page.getByLabel("Nouveau mot de passe").fill("Tr0ubadour-84");
    await page.getByLabel("Confirmer le mot de passe").fill("Tr0ubadour-85");
    await submit.click();
    await expect(page.getByText("Les deux mots de passe ne sont pas identiques.")).toBeVisible();

    await page.getByLabel("Nouveau mot de passe").fill("Tr0ubadour-84");
    await page.getByLabel("Confirmer le mot de passe").fill("Tr0ubadour-84");
    await submit.click();
    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/(\?saison=4)?$/);
    await expect(page.getByRole("button", { name: "Déconnexion" })).toBeVisible();
    expect((await getHits()).update).toBe(1);
  });

  test("/init-password?username=admin ouvert directement : sans effet (P2)", async ({ page }) => {
    await page.goto("/init-password?username=admin");
    await expect(page).toHaveURL(`${APP_URL}/login?reason=activation-expired`);
    await expect(page.getByRole("status")).toHaveText(
      "Le délai pour créer ton mot de passe est dépassé. Saisis de nouveau ton identifiant.",
    );
    expect((await getHits()).update).toBe(0);
  });
});

test.describe("Rôles et compte sans joueur", () => {
  test("compte sans joueur : bandeau explicatif et aucune saison", async ({ page, context }) => {
    await loginAs(context, "orphan");
    await page.goto("/");
    await expect(
      page.getByText(
        "Ton compte n'est pas rattaché à un joueur, donc aucune saison n'est disponible. Demande à un administrateur de le rattacher.",
      ),
    ).toBeVisible();
    await expect(page.getByText("Aucune saison disponible pour ton compte.")).toBeVisible();
  });

  // « Accès refusé » (403) : couvert en intégration (`requirePermission`). À brancher ici dès qu'une page réservée
  // (gestion des comptes, saisie de stats) existe dans la V2.
});

test.describe("Déconnexion", () => {
  test("supprime la session ; « Précédent » n'affiche pas de données protégées", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/game?saison=4");
    await expect(page.getByRole("heading", { level: 1, name: "Calendrier" })).toBeVisible();

    await page.getByRole("button", { name: "Déconnexion" }).click();
    await expect(page).toHaveURL(`${APP_URL}/login`);
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain(SESSION_COOKIE_NAME);

    await page.goBack();
    await expect(page.getByRole("heading", { level: 1, name: "Calendrier" })).not.toBeVisible();
  });
});

test.describe("Accessibilité", () => {
  test("parcours clavier du formulaire et langue de la page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByLabel("Identifiant")).toBeFocused();
    await page.keyboard.type("admin");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Mot de passe", { exact: true })).toBeFocused();
    await page.keyboard.type("admin-e2e");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Afficher le mot de passe" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/(\?saison=4)?$/);
  });
});
