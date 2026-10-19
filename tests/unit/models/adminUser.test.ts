import { describe, expect, it } from "vitest";
import type { Account } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { ACCOUNT_FAILURE_OPTIONS } from "@/models/accountFailureOptions";
import { ACCOUNT_FIELDS, AccountInputSchema } from "@/models/AccountInput";
import { ACCOUNT_LIST_SPEC } from "@/models/AccountListSpec";
import { PLAYER_PICKER_LIMIT, USERNAME_MAX_LENGTH } from "@/models/AccountRules";
import { ADMIN_REVALIDATION } from "@/models/adminRevalidation";
import { buildAccountCreateHref } from "@/models/buildAccountCreateHref";
import { buildAccountUsername } from "@/models/buildAccountUsername";
import { describeAccountListCaption } from "@/models/describeAccountListCaption";
import { dropInvalidAccountStatus } from "@/models/dropInvalidAccountStatus";
import { filterAccounts } from "@/models/filterAccounts";
import { findAccountByUsername } from "@/models/findAccountByUsername";
import { getAccountAnomalies } from "@/models/getAccountAnomalies";
import { getAccountLabel } from "@/models/getAccountLabel";
import { getAccountProtection } from "@/models/getAccountProtection";
import { isReservedUsername } from "@/models/isReservedUsername";
import { limitPickerPlayers } from "@/models/limitPickerPlayers";
import { listPlayersWithoutAccount } from "@/models/listPlayersWithoutAccount";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { parseAccountCreateParams } from "@/models/parseAccountCreateParams";
import { parseAccountFilters } from "@/models/parseAccountFilters";
import { parseAccountUsername } from "@/models/parseAccountUsername";
import { resolveAccountCreateRequest } from "@/models/resolveAccountCreateRequest";
import { sortAccounts } from "@/models/sortAccounts";
import { validateUsername } from "@/models/validateUsername";
import { makePlayerListEntry } from "./playerFactories";

function makeAccount(username: string, overrides: Partial<Account> = {}): Account {
  return {
    username,
    player: null,
    teamName: null,
    hasPassword: true,
    role: username === "admin" ? "admin" : "player",
    ...overrides,
  };
}

function withPlayer(username: string, licence: string, firstName: string, lastName: string, teamName: string | null = "FAC Basket") {
  return makeAccount(username, { player: { licence, firstName, lastName }, teamName });
}

describe("validateUsername", () => {
  it("refuse le vide en premier", () => {
    expect(validateUsername("")).toBe("required");
  });

  it("accepte 64 caractères, refuse 65 (en points de code)", () => {
    expect(validateUsername("a".repeat(64))).toBeNull();
    expect(validateUsername("a".repeat(65))).toBe("tooLong");
    expect(validateUsername("😀".repeat(65))).toBe("tooLong");
    expect(USERNAME_MAX_LENGTH).toBe(64);
  });

  it.each(["paul.durand", "éloïse.dupré", "a-b_c.d", "jean.2", "admin.2", "administrateur", "adminton", "ÀÉ12"])(
    "accepte %j",
    (value) => {
      expect(validateUsername(value)).toBeNull();
    },
  );

  it.each(["paul durand", "paul.durand ", " paul", "a/b", "a%20b", "a\tb", "a​b", "a?b", "a#b", "a\\b", "a\nb"])(
    "refuse %j (caractères)",
    (value) => {
      expect(validateUsername(value)).toBe("badCharacters");
    },
  );

  it.each(["admin", "Admin", "ADMIN", "ádmin", "ａｄｍｉｎ"])("refuse %j (réservé)", (value) => {
    expect(validateUsername(value)).toBe("reserved");
  });

  it("les variantes avec espace ou largeur nulle sont refusées avant la réservation", () => {
    expect(validateUsername("admin ")).toBe("badCharacters");
    expect(validateUsername("ad​min")).toBe("badCharacters");
  });

  it("ne nettoie rien : l'entrée n'est jamais modifiée", () => {
    expect(validateUsername(" Paul")).toBe("badCharacters");
  });
});

describe("isReservedUsername", () => {
  it.each(["admin", "Admin", "ADMIN", "admin ", " admin", "ádmin", "ａｄｍｉｎ", "ad​min"])(
    "%j est réservé",
    (value) => {
      expect(isReservedUsername(value)).toBe(true);
    },
  );

  it.each(["administrator", "admin.2", "paul", "", "аdmin"])("%j ne l'est pas (homoglyphes hors périmètre)", (value) => {
    expect(isReservedUsername(value)).toBe(false);
  });
});

describe("buildAccountUsername", () => {
  it("minuscules, prénom.nom, tirets et espaces internes en _", () => {
    expect(buildAccountUsername({ firstName: "Jean-Pierre", lastName: "Martin" })).toBe("jean_pierre.martin");
    expect(buildAccountUsername({ firstName: "Paul", lastName: "Le Gall" })).toBe("paul.le_gall");
  });

  it("conserve les accents", () => {
    expect(buildAccountUsername({ firstName: "Éloïse", lastName: "Dupré" })).toBe("éloïse.dupré");
  });

  it("rogne avant de remplacer : pas de _ initial", () => {
    expect(buildAccountUsername({ firstName: " Paul", lastName: "Durand " })).toBe("paul.durand");
  });

  it("un côté vide : l'autre seul, sans point ; les deux vides : chaîne vide", () => {
    expect(buildAccountUsername({ firstName: "", lastName: "Durand" })).toBe("durand");
    expect(buildAccountUsername({ firstName: "Paul", lastName: "  " })).toBe("paul");
    expect(buildAccountUsername({ firstName: "", lastName: "" })).toBe("");
  });
});

describe("parseAccountUsername", () => {
  it("identifiant simple", () => {
    expect(parseAccountUsername("paul.durand")).toBe("paul.durand");
  });

  it("décode un segment encodé une seule fois", () => {
    expect(parseAccountUsername("Jean%20Pierre.Martin")).toBe("Jean Pierre.Martin");
    expect(parseAccountUsername("a%2520b")).toBe("a%20b");
  });

  it("un segment déjà décodé (avec espace) est conservé", () => {
    expect(parseAccountUsername("Jean Pierre.Martin")).toBe("Jean Pierre.Martin");
  });

  it("un encodage invalide reste brut", () => {
    expect(parseAccountUsername("%E0%A4%A")).toBe("%E0%A4%A");
  });

  it.each(["", "a".repeat(256), "a\u0000b", "a%00b", "a\tb"])("%j → null", (value) => {
    expect(parseAccountUsername(value)).toBeNull();
  });

  it("255 caractères acceptés", () => {
    expect(parseAccountUsername("a".repeat(255))).toBe("a".repeat(255));
  });
});

describe("getAccountProtection", () => {
  const session = { username: "admin" };

  it("le compte connecté est protégé (self)", () => {
    expect(getAccountProtection(makeAccount("lucas"), { username: "lucas" })).toBe("self");
  });

  it("un compte admin est protégé", () => {
    expect(getAccountProtection(makeAccount("admin", { role: "admin" }), { username: "autre" })).toBe("admin");
  });

  it("l'admin connecté : self prime", () => {
    expect(getAccountProtection(makeAccount("admin"), session)).toBe("self");
  });

  it("un compte ambigu (player) n'est pas protégé", () => {
    expect(getAccountProtection(makeAccount("Admin "), session)).toBeNull();
  });

  it("un autre joueur n'est pas protégé ; la casse compte", () => {
    expect(getAccountProtection(makeAccount("paul"), session)).toBeNull();
    expect(getAccountProtection(makeAccount("Admin"), session)).toBeNull();
  });
});

describe("findAccountByUsername", () => {
  const accounts = [makeAccount("paul"), makeAccount("admin"), makeAccount("paul", { hasPassword: false })];

  it("égalité stricte", () => {
    expect(findAccountByUsername(accounts, "Paul")).toBeNull();
    expect(findAccountByUsername(accounts, "admin ")).toBeNull();
    expect(findAccountByUsername(accounts, "ADMIN")).toBeNull();
    expect(findAccountByUsername(accounts, "admin")).toBe(accounts[1]);
  });

  it("absent → null ; doublon → le premier", () => {
    expect(findAccountByUsername(accounts, "zoe")).toBeNull();
    expect(findAccountByUsername(accounts, "paul")).toBe(accounts[0]);
  });
});

describe("getAccountAnomalies", () => {
  it("admin sans joueur : aucune anomalie", () => {
    expect(getAccountAnomalies(makeAccount("admin"))).toEqual([]);
  });

  it("compte sans joueur : non rattaché", () => {
    expect(getAccountAnomalies(makeAccount("coach"))).toEqual(["unlinked"]);
  });

  it("compte avec joueur : aucune anomalie", () => {
    expect(getAccountAnomalies(withPlayer("paul", "L1", "Paul", "Durand"))).toEqual([]);
  });

  it("« Admin » : ambigu et non rattaché, dans cet ordre", () => {
    expect(getAccountAnomalies(makeAccount("Admin "))).toEqual(["unlinked", "ambiguousUsername"]);
  });

  it("identifiant ambigu avec joueur : ambigu seul", () => {
    expect(getAccountAnomalies(withPlayer("ADMIN", "L1", "Paul", "Durand"))).toEqual(["ambiguousUsername"]);
  });
});

describe("getAccountLabel", () => {
  it("nom du joueur", () => {
    expect(getAccountLabel(withPlayer("paul", "L1", "Paul", "Durand"))).toBe("Paul Durand");
  });

  it("licence si le joueur n'a pas de nom", () => {
    expect(getAccountLabel({ username: "x", player: { licence: "L9", firstName: "", lastName: " " } })).toBe("L9");
  });

  it("identifiant sans joueur", () => {
    expect(getAccountLabel(makeAccount("coach"))).toBe("coach");
  });
});

describe("listPlayersWithoutAccount", () => {
  const players = [makePlayerListEntry("Ana", "Abel", "L1"), makePlayerListEntry("Bob", "Bis", "L2"), makePlayerListEntry("Cy", "Cos", "L3")];

  it("écarte les licences déjà rattachées, ordre conservé", () => {
    const accounts = [withPlayer("bob", "L2", "Bob", "Bis"), makeAccount("admin")];
    expect(listPlayersWithoutAccount(players, accounts).map((entry) => entry.player.licence)).toEqual(["L1", "L3"]);
  });

  it("aucun compte : tous les joueurs", () => {
    expect(listPlayersWithoutAccount(players, [])).toHaveLength(3);
  });

  it("comparaison stricte de la licence", () => {
    expect(listPlayersWithoutAccount(players, [withPlayer("x", "l1", "A", "B")])).toHaveLength(3);
  });
});

describe("limitPickerPlayers", () => {
  it("coupe à 50 et garde le total", () => {
    const players = Array.from({ length: 60 }, (_, index) => makePlayerListEntry("P", `N${index}`, `L${index}`));
    const limited = limitPickerPlayers(players);
    expect(limited.shown).toHaveLength(PLAYER_PICKER_LIMIT);
    expect(limited.total).toBe(60);
  });

  it("moins de 50 : tout", () => {
    expect(limitPickerPlayers([makePlayerListEntry("P", "N", "L")])).toMatchObject({ total: 1 });
  });
});

describe("parseAccountFilters / dropInvalidAccountStatus", () => {
  it("statut connu conservé, inconnu → null", () => {
    expect(parseAccountFilters({ statut: "sans-mot-de-passe" })).toEqual({ status: "sans-mot-de-passe" });
    expect(parseAccountFilters({ statut: "non-rattache" })).toEqual({ status: "non-rattache" });
    expect(parseAccountFilters({ statut: "x" })).toEqual({ status: null });
    expect(parseAccountFilters({})).toEqual({ status: null });
  });

  it("dropInvalidAccountStatus retire une valeur invalide, garde le reste", () => {
    expect(dropInvalidAccountStatus({ statut: "x", q: "a" })).toEqual({ q: "a" });
    const valid = { statut: "non-rattache" };
    expect(dropInvalidAccountStatus(valid)).toBe(valid);
    const none = { q: "a" };
    expect(dropInvalidAccountStatus(none)).toBe(none);
    expect(dropInvalidAccountStatus({ statut: "" })).toEqual({});
  });
});

describe("filterAccounts", () => {
  const accounts = [
    withPlayer("eloise.roussel", "L1", "Éloïse", "Roussel", "FAC Basket"),
    withPlayer("paul.durand", "L2", "Paul", "Durand", "Basket Cazères"),
    makeAccount("coach", { hasPassword: false }),
    makeAccount("admin"),
  ];

  it("recherche vide : tout", () => {
    expect(filterAccounts(accounts, { q: "", status: null })).toHaveLength(4);
  });

  it("recherche sans accent", () => {
    expect(filterAccounts(accounts, { q: "eloise", status: null }).map((a) => a.username)).toEqual(["eloise.roussel"]);
  });

  it("recherche par équipe et par identifiant", () => {
    expect(filterAccounts(accounts, { q: "cazeres", status: null }).map((a) => a.username)).toEqual(["paul.durand"]);
    expect(filterAccounts(accounts, { q: "coach", status: null }).map((a) => a.username)).toEqual(["coach"]);
  });

  it("filtre sans mot de passe", () => {
    expect(filterAccounts(accounts, { q: "", status: "sans-mot-de-passe" }).map((a) => a.username)).toEqual(["coach"]);
  });

  it("filtre non rattaché : l'admin n'y figure pas", () => {
    expect(filterAccounts(accounts, { q: "", status: "non-rattache" }).map((a) => a.username)).toEqual(["coach"]);
  });

  it("les critères se cumulent (ET)", () => {
    expect(filterAccounts(accounts, { q: "paul", status: "sans-mot-de-passe" })).toEqual([]);
  });
});

describe("sortAccounts", () => {
  const accounts = [
    makeAccount("zoe"),
    withPlayer("paul.durand", "L2", "Paul", "Durand", "Basket Cazères"),
    withPlayer("anna.durand", "L3", "Anna", "Durand", "FAC Basket"),
    makeAccount("admin"),
    withPlayer("eloise", "L1", "Éloïse", "Abel", "FAC Basket"),
  ];
  const names = (sorted: Account[]) => sorted.map((account) => account.username);

  it("joueur asc : nom puis prénom, comptes sans joueur à la fin (ordre d'identifiant)", () => {
    expect(names(sortAccounts(accounts, { column: "joueur", direction: "asc" }))).toEqual([
      "eloise",
      "anna.durand",
      "paul.durand",
      "admin",
      "zoe",
    ]);
  });

  it("joueur desc : comptes sans joueur d'abord", () => {
    const sorted = names(sortAccounts(accounts, { column: "joueur", direction: "desc" }));
    expect(sorted.slice(0, 2)).toEqual(["admin", "zoe"]);
    expect(sorted[2]).toBe("paul.durand");
  });

  it("identifiant et équipe", () => {
    expect(names(sortAccounts(accounts, { column: "identifiant", direction: "asc" }))[0]).toBe("admin");
    expect(names(sortAccounts(accounts, { column: "equipe", direction: "asc" }))).toEqual([
      "paul.durand",
      "anna.durand",
      "eloise",
      "admin",
      "zoe",
    ]);
  });

  it("ne mute pas l'entrée", () => {
    const copy = [...accounts];
    sortAccounts(accounts, { column: "identifiant", direction: "desc" });
    expect(accounts).toEqual(copy);
  });
});

describe("parseAccountCreateParams / buildAccountCreateHref / resolveAccountCreateRequest", () => {
  it("q rognée et tronquée à 100, premier élément d'un tableau", () => {
    expect(parseAccountCreateParams({ q: "  abc  " }).q).toBe("abc");
    expect(parseAccountCreateParams({ q: "x".repeat(150) }).q).toHaveLength(100);
    expect(parseAccountCreateParams({ q: ["a", "b"] }).q).toBe("a");
  });

  it("licence invalide → null, valide conservée, autres clés ignorées", () => {
    expect(parseAccountCreateParams({ joueur: "a b" })).toEqual({ q: "", licence: null });
    expect(parseAccountCreateParams({ joueur: "LIC1000", x: "1" })).toEqual({ q: "", licence: "LIC1000" });
  });

  it("forme canonique : valeurs vides omises, ordre q puis joueur", () => {
    expect(buildAccountCreateHref({})).toBe("/admin/user/create");
    expect(buildAccountCreateHref({ q: "", licence: null })).toBe("/admin/user/create");
    expect(buildAccountCreateHref({ licence: "LIC1" })).toBe("/admin/user/create?joueur=LIC1");
    expect(buildAccountCreateHref({ q: "éloïse dup", licence: "LIC1" })).toBe(
      "/admin/user/create?q=%C3%A9lo%C3%AFse+dup&joueur=LIC1",
    );
  });

  it("aller-retour sans boucle", () => {
    const first = resolveAccountCreateRequest({ q: " eloise ", joueur: "LIC1000" });
    expect(first.redirectTo).toBe("/admin/user/create?q=eloise&joueur=LIC1000");
    const second = resolveAccountCreateRequest({ q: "eloise", joueur: "LIC1000" });
    expect(second.redirectTo).toBeNull();
    expect(second.params).toEqual({ q: "eloise", licence: "LIC1000" });
  });

  it("licence invalide ou clé inconnue : redirection vers la forme canonique", () => {
    expect(resolveAccountCreateRequest({ joueur: "a b" }).redirectTo).toBe("/admin/user/create");
    expect(resolveAccountCreateRequest({ x: "1" }).redirectTo).toBe("/admin/user/create");
    expect(resolveAccountCreateRequest({ q: ["a", "b"] }).redirectTo).toBe("/admin/user/create?q=a");
    expect(resolveAccountCreateRequest({}).redirectTo).toBeNull();
  });
});

describe("AccountInputSchema", () => {
  it("accepte un identifiant valide", () => {
    expect(AccountInputSchema.safeParse({ username: "paul.durand" }).success).toBe(true);
  });

  it.each([
    ["", ACCOUNT_MESSAGES.username.required],
    ["a".repeat(65), ACCOUNT_MESSAGES.username.tooLong],
    ["paul durand", ACCOUNT_MESSAGES.username.badCharacters],
    ["Admin", ACCOUNT_MESSAGES.username.reserved],
  ])("%j → message exact", (username, message) => {
    const result = AccountInputSchema.safeParse({ username });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]).toMatchObject({ path: ["username"], message });
  });

  it("n'expose que le champ identifiant", () => {
    expect(ACCOUNT_FIELDS).toEqual(["username"]);
  });
});

describe("messages et échecs d'écriture", () => {
  const values = { username: "paul" };

  it("422 taken → texte français sous le champ, jamais la phrase du back", () => {
    const state = mapWriteFailure(
      { kind: "invalid", errors: { username: ["The username has already been taken."] } },
      values,
      ACCOUNT_FAILURE_OPTIONS,
    );
    expect(state.fieldErrors.username).toBe("Cet identifiant est déjà utilisé.");
  });

  it("422 required → message de l'identifiant vide", () => {
    const state = mapWriteFailure(
      { kind: "invalid", errors: { username: ["The username field is required."] } },
      values,
      ACCOUNT_FAILURE_OPTIONS,
    );
    expect(state.fieldErrors.username).toBe(ACCOUNT_MESSAGES.username.required);
  });

  it("erreur sur `joueur` non mappée → message générique", () => {
    const state = mapWriteFailure(
      { kind: "invalid", errors: { joueur: ["The selected joueur is invalid."] } },
      values,
      ACCOUNT_FAILURE_OPTIONS,
    );
    expect(state.fieldErrors).toEqual({});
    expect(state.message).toContain("refusé");
  });

  it("404 → « Ce compte n'existe plus »", () => {
    expect(mapWriteFailure({ kind: "notFound", backMessage: null }, values, ACCOUNT_FAILURE_OPTIONS).message).toBe(
      ACCOUNT_MESSAGES.gone,
    );
  });
});

describe("describeAccountListCaption", () => {
  it("compteur et tri", () => {
    expect(describeAccountListCaption(1, 1, { column: "joueur", direction: "asc" })).toBe(
      "1 compte · triés par joueur, de A à Z",
    );
    expect(describeAccountListCaption(2, 12, { column: "identifiant", direction: "desc" })).toBe(
      "2 comptes sur 12 · triés par identifiant, de Z à A",
    );
  });

  it("colonne inconnue : compteur seul", () => {
    expect(describeAccountListCaption(0, 0, { column: "?", direction: "asc" })).toBe("0 compte");
  });
});

describe("ADMIN_REVALIDATION (C3, C7)", () => {
  it("user : liste et création", () => {
    expect(ADMIN_REVALIDATION.user.targets).toEqual(["/admin/user", "/admin/user/create"]);
    expect(ADMIN_REVALIDATION.user.hallOfFameOn).toEqual([]);
  });

  it("supprimer ou créer un joueur ou une équipe rafraîchit la liste et la création de comptes", () => {
    for (const entity of ["player", "team"] as const) {
      expect(ADMIN_REVALIDATION[entity].targets).toContain("/admin/user");
    }
    expect(ADMIN_REVALIDATION.player.targets).toContain("/admin/user/create");
    expect(ADMIN_REVALIDATION.team.targets).toContain("/admin/user/create");
  });

  it("la liste de comptes n'est pas rattachée à la liste des matchs ou des saisons", () => {
    expect(ADMIN_REVALIDATION.season.targets).not.toContain("/admin/user");
  });
});

describe("ACCOUNT_LIST_SPEC", () => {
  it("tri par défaut sur le joueur, filtre statut", () => {
    expect(ACCOUNT_LIST_SPEC.defaultSort).toEqual({ column: "joueur", direction: "asc" });
    expect(ACCOUNT_LIST_SPEC.filters).toEqual(["statut"]);
  });
});
