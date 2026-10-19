// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PlayerSearchList } from "@/views/player-list/components/PlayerSearchList";
import { makePlayerListEntry } from "../models/playerFactories";

const entries = [
  makePlayerListEntry("Paul", "DURAND", "L1"),
  makePlayerListEntry("Élodie", "ROUSSEL", "L2"),
  makePlayerListEntry("Lucas", "MARCHAND", "L3"),
];

describe("PlayerSearchList", () => {
  it("affiche une carte par joueur : un seul lien au nom concis, vers la fiche de la saison", () => {
    render(<PlayerSearchList entries={entries} seasonParam="4" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    const link = screen.getByRole("link", { name: "Paul DURAND" });
    expect(link).toHaveAttribute("href", "/player/L1?saison=4");
    expect(within(screen.getAllByRole("listitem")[0]).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("3 joueurs affichés")).toBeInTheDocument();
  });

  it("sans saison, le lien ne porte pas de paramètre", () => {
    render(<PlayerSearchList entries={entries} seasonParam={null} />);
    expect(screen.getByRole("link", { name: "Paul DURAND" })).toHaveAttribute("href", "/player/L1");
  });

  it("filtre sans accents ni casse et annonce le nombre affiché", async () => {
    render(<PlayerSearchList entries={entries} seasonParam="4" />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Rechercher un joueur" }), "ELODIE");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("1 joueur affiché")).toBeInTheDocument();
  });

  it("aucun résultat : message avec la recherche, puis « Effacer » rend la liste et le focus", async () => {
    render(<PlayerSearchList entries={entries} seasonParam="4" />);
    const field = screen.getByRole("searchbox");
    await userEvent.type(field, "zzz");
    expect(screen.getByText("Aucun joueur ne correspond à « zzz ».")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Effacer" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(field).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Effacer" })).not.toBeInTheDocument();
  });

  it("n'expose aucune donnée personnelle", () => {
    const { container } = render(<PlayerSearchList entries={entries} seasonParam="4" />);
    expect(container.textContent).not.toMatch(/naissance|civilit/i);
  });
});
