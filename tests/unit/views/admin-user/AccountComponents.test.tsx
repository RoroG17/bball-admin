// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Account } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { PLAYER_PICKER_LIMIT } from "@/models/AccountRules";
import { AccountBadges } from "@/views/admin-user/components/AccountBadges";
import { AccountCreatedNotice } from "@/views/admin-user/components/AccountCreatedNotice";
import { AccountDeletionConsequences } from "@/views/admin-user/components/AccountDeletionConsequences";
import { AccountPasswordStatus } from "@/views/admin-user/components/AccountPasswordStatus";
import { AccountPlayerCell } from "@/views/admin-user/components/AccountPlayerCell";
import { AccountPlayerPicker } from "@/views/admin-user/components/AccountPlayerPicker";
import { AccountProtectedMessage } from "@/views/admin-user/components/AccountProtectedMessage";
import { AccountResetConsequences } from "@/views/admin-user/components/AccountResetConsequences";
import { AccountRowActions } from "@/views/admin-user/components/AccountRowActions";
import { AccountUsernameCell } from "@/views/admin-user/components/AccountUsernameCell";
import { makePlayerListEntry } from "../../models/playerFactories";

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

const PAUL = makeAccount("paul.durand", {
  player: { licence: "LIC1001", firstName: "Paul", lastName: "Durand" },
  teamName: "FAC Basket",
});

describe("AccountRowActions", () => {
  it("noms accessibles « Réinitialiser Paul Durand » et « Supprimer Paul Durand » avec les bons liens", () => {
    render(<AccountRowActions account={PAUL} session={{ username: "admin" }} />);
    expect(screen.getByRole("link", { name: "Réinitialiser Paul Durand" })).toHaveAttribute(
      "href",
      "/admin/user/paul.durand/reset",
    );
    expect(screen.getByRole("link", { name: "Supprimer Paul Durand" })).toHaveAttribute(
      "href",
      "/admin/user/paul.durand/delete",
    );
  });

  it("compte sans joueur : le nom accessible contient l'identifiant", () => {
    render(<AccountRowActions account={makeAccount("coach")} session={{ username: "admin" }} />);
    expect(screen.getByRole("link", { name: "Réinitialiser coach" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Supprimer coach" })).toBeInTheDocument();
  });

  it("un identifiant avec espace est encodé dans l'URL", () => {
    render(<AccountRowActions account={makeAccount("Jean Pierre.Martin")} session={{ username: "admin" }} />);
    expect(screen.getByRole("link", { name: "Supprimer Jean Pierre.Martin" })).toHaveAttribute(
      "href",
      "/admin/user/Jean%20Pierre.Martin/delete",
    );
  });

  it("compte admin : aucun bouton, « Compte protégé » et la raison pour les lecteurs d'écran", () => {
    render(<AccountRowActions account={makeAccount("admin")} session={{ username: "autre" }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Compte protégé")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(ACCOUNT_MESSAGES.protection.admin.slice(0, 30)))).toBeInTheDocument();
  });

  it("compte connecté : aucun bouton, raison « ton propre compte »", () => {
    render(<AccountRowActions account={PAUL} session={{ username: "paul.durand" }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Compte protégé")).toBeInTheDocument();
    expect(screen.getByText(new RegExp("ton propre compte"))).toBeInTheDocument();
  });

  it("compte ambigu « Admin  » (joueur) : non protégé", () => {
    render(<AccountRowActions account={makeAccount("Admin ")} session={{ username: "admin" }} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});

describe("AccountPasswordStatus", () => {
  it("le sens passe par le texte", () => {
    const { rerender } = render(<AccountPasswordStatus hasPassword />);
    expect(screen.getByText("Défini")).toBeInTheDocument();
    rerender(<AccountPasswordStatus hasPassword={false} />);
    expect(screen.getByText("Non défini")).toBeInTheDocument();
    expect(screen.queryByText("Défini")).not.toBeInTheDocument();
  });
});

describe("AccountBadges", () => {
  it("compte admin : « Administrateur » seul", () => {
    render(<AccountBadges account={makeAccount("admin")} />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Administrateur"]);
  });

  it("compte sans joueur : « Non rattaché »", () => {
    render(<AccountBadges account={makeAccount("coach")} />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Non rattaché"]);
  });

  it("« Admin » : non rattaché et identifiant ambigu", () => {
    render(<AccountBadges account={makeAccount("Admin ")} />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Non rattaché",
      "Identifiant ambigu",
    ]);
  });

  it("aucune remarque : tiret", () => {
    render(<AccountBadges account={PAUL} />);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Aucune remarque")).toHaveTextContent("—");
  });
});

describe("AccountPlayerCell / AccountUsernameCell", () => {
  it("lien vers la fiche, ou « Aucun joueur »", () => {
    const { rerender } = render(<AccountPlayerCell account={PAUL} />);
    expect(screen.getByRole("link", { name: "Paul Durand" })).toHaveAttribute("href", "/player/LIC1001");
    rerender(<AccountPlayerCell account={makeAccount("coach")} />);
    expect(screen.getByText("Aucun joueur")).toBeInTheDocument();
  });

  it("identifiant dans <code> ; pastille texte quand le compte vient d'être créé", () => {
    const { rerender } = render(<AccountUsernameCell username="paul.durand" highlighted={false} />);
    expect(screen.getByText("paul.durand").tagName).toBe("CODE");
    expect(screen.queryByText(/Vient d'être enregistré/)).not.toBeInTheDocument();
    rerender(<AccountUsernameCell username="paul.durand" highlighted />);
    expect(screen.getByText(/Vient d'être enregistré/)).toBeInTheDocument();
  });
});

describe("AccountPlayerPicker", () => {
  const players = Array.from({ length: 60 }, (_, index) =>
    makePlayerListEntry(`Prenom${index}`, `Nom${String(index).padStart(2, "0")}`, `LIC${index}`),
  );

  it("50 joueurs au plus et compteur « 50 sur 60 joueurs »", () => {
    render(<AccountPlayerPicker players={players} q="" selectedLicence={null} />);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(PLAYER_PICKER_LIMIT);
    expect(screen.getByText("50 sur 60 joueurs : affine la recherche.")).toBeInTheDocument();
  });

  it("moins de 50 : compteur « N joueurs sans compte »", () => {
    render(<AccountPlayerPicker players={players.slice(0, 12)} q="" selectedLicence={null} />);
    expect(screen.getByText("12 joueurs sans compte")).toBeInTheDocument();
  });

  it("la recherche filtre sans accent ; les liens gardent la recherche et choisissent la licence", () => {
    render(<AccountPlayerPicker players={[makePlayerListEntry("Éloïse", "Roussel", "LIC7"), ...players]} q="eloise" selectedLicence={null} />);
    const link = screen.getByRole("link", { name: "Éloïse Roussel, FAC Basket" });
    expect(link).toHaveAttribute("href", "/admin/user/create?q=eloise&joueur=LIC7");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("aria-current sur le joueur choisi, et la recherche garde le choix", () => {
    const { container } = render(<AccountPlayerPicker players={players.slice(0, 3)} q="" selectedLicence="LIC1" />);
    expect(screen.getByRole("link", { name: /Prenom1 Nom01/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /Prenom0 Nom00/ })).not.toHaveAttribute("aria-current");
    expect(container.querySelector('input[name="joueur"]')).toHaveValue("LIC1");
  });

  it("tous les joueurs ont un compte", () => {
    render(<AccountPlayerPicker players={[]} q="" selectedLicence={null} />);
    expect(screen.getByText("Tous les joueurs ont déjà un compte.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("recherche sans résultat", () => {
    render(<AccountPlayerPicker players={players} q="zzz" selectedLicence={null} />);
    expect(screen.getByText("Aucun joueur ne correspond à « zzz ».")).toBeInTheDocument();
  });

  it("rappelle qu'un joueur sans équipe n'apparaît pas", () => {
    render(<AccountPlayerPicker players={players} q="" selectedLicence={null} />);
    expect(screen.getByText(ACCOUNT_MESSAGES.noTeamHint)).toBeInTheDocument();
  });
});

describe("conséquences et messages", () => {
  it("réinitialisation : sessions non coupées et identifiant à protéger", () => {
    render(<AccountResetConsequences account={PAUL} />);
    expect(screen.getByText(/Les appareils déjà connectés le restent/)).toBeInTheDocument();
    expect(screen.getByText(/« paul\.durand »/)).toBeInTheDocument();
  });

  it("suppression : joueur conservé, sessions non coupées, journaux sans auteur", () => {
    render(<AccountDeletionConsequences account={PAUL} />);
    expect(screen.getByText(/Le joueur Paul Durand et toutes ses statistiques sont conservés/)).toBeInTheDocument();
    expect(screen.getByText(/jusqu'à l'expiration de leur session/)).toBeInTheDocument();
    expect(screen.getByText(/perdent leur auteur/)).toBeInTheDocument();
  });

  it("suppression d'un compte sans joueur", () => {
    render(<AccountDeletionConsequences account={makeAccount("coach")} />);
    expect(screen.getByText("Ce compte n'est rattaché à aucun joueur.")).toBeInTheDocument();
  });

  it("bandeau de création : identifiant à communiquer et avertissement « non rattaché »", () => {
    render(<AccountCreatedNotice account={makeAccount("nouveau.compte")} />);
    expect(screen.getByText(/Identifiant à communiquer à nouveau\.compte : nouveau\.compte\./)).toBeInTheDocument();
    expect(screen.getByText(ACCOUNT_MESSAGES.unlinkedWarning)).toBeInTheDocument();
  });

  it("bandeau de création d'un compte rattaché : pas d'avertissement", () => {
    render(<AccountCreatedNotice account={PAUL} />);
    expect(screen.getByText(/Identifiant à communiquer à Paul Durand : paul\.durand\./)).toBeInTheDocument();
    expect(screen.queryByText(ACCOUNT_MESSAGES.unlinkedWarning)).not.toBeInTheDocument();
  });

  it("compte protégé ouvert à la main : message d'alerte, retour à la liste, aucun formulaire", () => {
    const { container } = render(<AccountProtectedMessage protection="admin" listHref="/admin/user" />);
    expect(screen.getByRole("alert")).toHaveTextContent(ACCOUNT_MESSAGES.protection.admin);
    expect(screen.getByRole("link", { name: "Retour à la liste" })).toHaveAttribute("href", "/admin/user");
    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
