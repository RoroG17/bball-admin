// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParticipantActionResult } from "@/models/ParticipantAction";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { ParticipantActionButton } from "@/views/admin-season/components/ParticipantActionButton";
import { ParticipantsFeedback } from "@/views/admin-season/components/ParticipantsFeedback";
import { SeasonCandidateList } from "@/views/admin-season/components/SeasonCandidateList";
import { SeasonCandidateSearch } from "@/views/admin-season/components/SeasonCandidateSearch";
import { SeasonParticipantList } from "@/views/admin-season/components/SeasonParticipantList";
import { SeasonRecencyBadge } from "@/views/admin-season/components/SeasonRecencyBadge";
import { SeasonTeamCell } from "@/views/admin-season/components/SeasonTeamCell";
import { makePlayerListEntry } from "../../models/playerFactories";

const actions = vi.hoisted(() => ({ addSeasonParticipant: vi.fn(), removeSeasonParticipant: vi.fn() }));
vi.mock("@/actions/seasonActions", () => actions);
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function renderButton(intent: "add" | "remove" = "add") {
  return render(
    <ParticipantsFeedback>
      <ParticipantActionButton
        intent={intent}
        seasonId={4}
        licence="LIC1000"
        playerName="Lucas Marchand"
        label={intent === "add" ? "Inscrire" : "Retirer"}
        accessibleLabel={intent === "add" ? "Inscrire Lucas Marchand à la saison" : "Retirer Lucas Marchand de la saison"}
      />
    </ParticipantsFeedback>,
  );
}

beforeEach(() => {
  actions.addSeasonParticipant.mockReset();
  actions.removeSeasonParticipant.mockReset();
});

describe("ParticipantActionButton", () => {
  it("nom accessible avec le joueur ; appelle l'action d'ajout avec { seasonId, licence }", async () => {
    actions.addSeasonParticipant.mockResolvedValue({ status: "success", outcome: "added" } satisfies ParticipantActionResult);
    renderButton("add");
    await userEvent.click(screen.getByRole("button", { name: "Inscrire Lucas Marchand à la saison" }));
    expect(actions.addSeasonParticipant).toHaveBeenCalledWith({ seasonId: 4, licence: "LIC1000" });
    expect(actions.removeSeasonParticipant).not.toHaveBeenCalled();
  });

  it("retrait : appelle l'action de retrait", async () => {
    actions.removeSeasonParticipant.mockResolvedValue({ status: "success", outcome: "removed" } satisfies ParticipantActionResult);
    renderButton("remove");
    await userEvent.click(screen.getByRole("button", { name: "Retirer Lucas Marchand de la saison" }));
    expect(actions.removeSeasonParticipant).toHaveBeenCalledWith({ seasonId: 4, licence: "LIC1000" });
    expect(actions.addSeasonParticipant).not.toHaveBeenCalled();
  });

  it("deux clics rapides = un seul appel ; désactivé et occupé pendant l'appel", async () => {
    const pending = deferred<ParticipantActionResult>();
    actions.addSeasonParticipant.mockReturnValue(pending.promise);
    renderButton();
    const button = screen.getByRole("button", { name: /Inscrire/ });
    await userEvent.dblClick(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(actions.addSeasonParticipant).toHaveBeenCalledTimes(1);
    pending.resolve({ status: "success", outcome: "added" });
    await waitFor(() => expect(button).toBeEnabled());
  });

  it("remonte le résultat à la zone d'annonce", async () => {
    actions.addSeasonParticipant.mockResolvedValue({ status: "success", outcome: "added" });
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("Inscription enregistrée : Lucas Marchand.");
  });

  it("une action qui échoue (réseau) est annoncée en alerte", async () => {
    actions.addSeasonParticipant.mockRejectedValue(new Error("boom"));
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(ADMIN_MESSAGES.networkWrite);
  });

  it("sans zone d'annonce, ne fait rien", async () => {
    render(
      <ParticipantActionButton
        intent="add"
        seasonId={4}
        licence="LIC1000"
        playerName="Lucas Marchand"
        label="Inscrire"
        accessibleLabel="Inscrire Lucas Marchand à la saison"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    expect(actions.addSeasonParticipant).not.toHaveBeenCalled();
  });
});

describe("ParticipantsFeedback", () => {
  it("rien tant qu'aucune action", () => {
    renderButton();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("succès : role=status avec la phrase de l'issue « déjà inscrit »", async () => {
    actions.addSeasonParticipant.mockResolvedValue({ status: "success", outcome: "unchanged" });
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("Déjà inscrit : Lucas Marchand. Rien n'a été modifié.");
  });

  it("erreur : role=alert avec le message ; le focus est déplacé sur la zone", async () => {
    actions.addSeasonParticipant.mockResolvedValue({ status: "error", message: "Ce joueur ou cette saison n'existe plus. Recharge la page." });
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("n'existe plus");
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it("« Fermer » vide la zone", async () => {
    actions.addSeasonParticipant.mockResolvedValue({ status: "success", outcome: "added" });
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    await screen.findByRole("status");
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("une nouvelle action vide la zone avant d'annoncer son propre résultat", async () => {
    const second = deferred<ParticipantActionResult>();
    actions.addSeasonParticipant
      .mockResolvedValueOnce({ status: "success", outcome: "added" })
      .mockReturnValueOnce(second.promise);
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    await screen.findByRole("status");

    await userEvent.click(screen.getByRole("button", { name: /Inscrire/ }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    second.resolve({ status: "error", message: "Échec" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Échec");
  });
});

describe("SeasonCandidateSearch", () => {
  it("formulaire GET vers la section des participants, valeur reprise, lien « Effacer » seulement avec une recherche", () => {
    const { rerender } = render(<SeasonCandidateSearch seasonId={4} query="" />);
    const form = screen.getByRole("search", { name: "Rechercher un joueur à inscrire" });
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/admin/season/4/edit#participants");
    expect(screen.queryByRole("link", { name: "Effacer la recherche" })).not.toBeInTheDocument();

    rerender(<SeasonCandidateSearch seasonId={4} query="elodie" />);
    expect(screen.getByRole("searchbox", { name: "Rechercher un joueur à inscrire" })).toHaveValue("elodie");
    expect(screen.getByRole("link", { name: "Effacer la recherche" })).toHaveAttribute("href", "/admin/season/4/edit#participants");
  });
});

describe("SeasonParticipantList / SeasonCandidateList", () => {
  const paul = makePlayerListEntry("Paul", "Durand", "L2");
  const elodie = makePlayerListEntry("Élodie", "Roussel", "L1");

  it("liste des inscrits : bouton « Retirer » avec le joueur dans le nom accessible", () => {
    render(<SeasonParticipantList participants={[paul]} seasonId={4} />);
    expect(screen.getByText("Paul Durand")).toBeInTheDocument();
    expect(screen.getByText(/FAC Basket · L2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retirer Paul Durand de la saison" })).toBeInTheDocument();
  });

  it("aucun inscrit : texte exact", () => {
    render(<SeasonParticipantList participants={[]} seasonId={4} />);
    expect(screen.getByText("Aucun joueur inscrit sur cette saison.")).toBeInTheDocument();
    expect(screen.getByText("Ajoute des joueurs avec la recherche ci-dessous.")).toBeInTheDocument();
  });

  it("candidats : « Inscrire » et mention de troncature", () => {
    render(<SeasonCandidateList candidates={[elodie]} candidateTotal={45} query="" seasonId={4} playerCount={50} />);
    expect(screen.getByRole("button", { name: "Inscrire Élodie Roussel à la saison" })).toBeInTheDocument();
    expect(screen.getByText("1 premiers résultats sur 45 : précise la recherche.")).toBeInTheDocument();
  });

  it("états vides : aucun joueur, tous inscrits, aucune correspondance", () => {
    const { rerender } = render(<SeasonCandidateList candidates={[]} candidateTotal={0} query="" seasonId={4} playerCount={0} />);
    expect(screen.getByText("Aucun joueur n'existe encore.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Créer un joueur" })).toHaveAttribute("href", "/admin/player/create");

    rerender(<SeasonCandidateList candidates={[]} candidateTotal={0} query="" seasonId={4} playerCount={12} />);
    expect(screen.getByText("Tous les joueurs sont déjà inscrits sur cette saison.")).toBeInTheDocument();

    rerender(<SeasonCandidateList candidates={[]} candidateTotal={0} query="zzz" seasonId={4} playerCount={12} />);
    expect(screen.getByText("Aucun joueur non inscrit ne correspond à « zzz ».")).toBeInTheDocument();
  });
});

describe("SeasonTeamCell / SeasonRecencyBadge", () => {
  it("équipe non renseignée : texte exact", () => {
    render(<SeasonTeamCell cell={{ kind: "none" }} />);
    expect(screen.getByText("Équipe RPB non renseignée")).toBeInTheDocument();
  });

  it("équipe introuvable et liste illisible : repli sur l'identifiant", () => {
    const { rerender } = render(<SeasonTeamCell cell={{ kind: "unknown", id: 9 }} />);
    expect(screen.getByText("Équipe n° 9 introuvable")).toBeInTheDocument();
    rerender(<SeasonTeamCell cell={{ kind: "unavailable", id: 9 }} />);
    expect(screen.getByText("Équipe n° 9")).toBeInTheDocument();
  });

  it("équipe nommée : le nom est écrit, le logo est décoratif", () => {
    render(<SeasonTeamCell cell={{ kind: "named", name: "FAC Basket", logoUrl: null }} />);
    expect(screen.getByText("FAC Basket")).toBeInTheDocument();
    expect(screen.queryByText("Logo FAC Basket")).not.toBeInTheDocument();
  });

  it("badge « Plus récente » : texte, jamais la couleur seule", () => {
    render(<SeasonRecencyBadge />);
    expect(screen.getByText("Plus récente")).toBeInTheDocument();
    expect(screen.getByTitle("Saison la plus récente : affichée par défaut dans l'application")).toBeInTheDocument();
  });
});
