// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SeasonSelector } from "@/components/ui/SeasonSelector";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const options = [
  { id: 4, label: "2025-2026 · D1 · U15G" },
  { id: 7, label: "2024-2025 · D3 · U15G" },
];

describe("SeasonSelector", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("affiche la saison sélectionnée", () => {
    render(<SeasonSelector options={options} selectedId={4} basePath="/" />);
    expect(screen.getByRole("combobox")).toHaveValue("4");
  });

  it("associe le libellé au sélecteur", () => {
    render(<SeasonSelector options={options} selectedId={4} basePath="/" />);
    expect(screen.getByLabelText("Saison affichée")).toBe(screen.getByRole("combobox"));
  });

  it("navigue vers la saison choisie", async () => {
    render(<SeasonSelector options={options} selectedId={4} basePath="/" />);
    await userEvent.selectOptions(screen.getByLabelText("Saison affichée"), "7");
    expect(push).toHaveBeenCalledWith("/?saison=7");
    expect(screen.getByRole("combobox")).toHaveValue("7");
  });

  it("navigue sous le chemin de base fourni", async () => {
    render(<SeasonSelector options={options} selectedId={4} basePath="/game" />);
    await userEvent.selectOptions(screen.getByLabelText("Saison affichée"), "7");
    expect(push).toHaveBeenCalledWith("/game?saison=7");
  });

  it("accepte des identifiants texte, renvoie l'identifiant d'origine et conserve les autres paramètres", async () => {
    const mixed = [
      { id: 4, label: "2025-2026 · D1 · U15G" },
      { id: "carriere", label: "Carrière" },
    ];
    render(
      <SeasonSelector options={mixed} selectedId={4} basePath="/player/LIC1000" query={{ onglet: "examens" }} label="Saison" />,
    );
    expect(screen.getByLabelText("Saison")).toHaveValue("4");
    await userEvent.selectOptions(screen.getByLabelText("Saison"), "carriere");
    expect(push).toHaveBeenCalledWith("/player/LIC1000?onglet=examens&saison=carriere");
  });

  it("affiche une valeur texte sélectionnée", () => {
    const mixed = [
      { id: 4, label: "2025-2026" },
      { id: "tous", label: "Tous les joueurs" },
    ];
    render(<SeasonSelector options={mixed} selectedId="tous" basePath="/player" />);
    expect(screen.getByRole("combobox")).toHaveValue("tous");
  });
});
